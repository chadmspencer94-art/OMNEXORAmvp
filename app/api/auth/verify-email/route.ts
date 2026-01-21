import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { consumeEmailVerificationToken } from "@/lib/email-verification";

/**
 * POST /api/auth/verify-email
 * Verifies an email address using a token from the verification link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Sanitize the token (remove any URL encoding issues)
    const cleanToken = decodeURIComponent(token).trim();

    if (!cleanToken || cleanToken.length < 32) {
      return NextResponse.json(
        { error: "Invalid verification token format" },
        { status: 400 }
      );
    }

    // Consume the token (verifies and deletes it for single-use)
    let verificationToken;
    try {
      verificationToken = await consumeEmailVerificationToken(cleanToken);
    } catch (tokenError) {
      console.error("[verify-email] Error consuming token:", tokenError);
      return NextResponse.json(
        { error: "Failed to verify token. Please request a new verification email." },
        { status: 500 }
      );
    }

    if (!verificationToken) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Get the user
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: verificationToken.userId },
    });

    if (!user) {
      console.error(`[verify-email] User not found for ID: ${verificationToken.userId}`);
      return NextResponse.json(
        { error: "User account not found. Please contact support." },
        { status: 404 }
      );
    }

    // Check if already verified (in case of race condition or duplicate request)
    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { success: true, alreadyVerified: true },
        { status: 200 }
      );
    }

    // Update user's emailVerifiedAt
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`[verify-email] Email verified for user: ${user.email}`);
    } catch (updateError) {
      console.error("[verify-email] Failed to update user:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email. Please try again." },
        { status: 500 }
      );
    }

    // Also update KV store if user exists there
    try {
      const { kv } = await import("@/lib/kv");
      const kvUser = (await kv.get(`user:email:${user.email.toLowerCase()}`)) as any;
      if (kvUser) {
        kvUser.emailVerifiedAt = new Date().toISOString();
        await kv.set(`user:id:${kvUser.id}`, kvUser);
        await kv.set(`user:email:${user.email.toLowerCase()}`, kvUser);
      }
    } catch (kvError) {
      // Non-critical - log but don't fail
      console.warn("[verify-email] Failed to update KV store (non-critical):", kvError);
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verify-email] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again or request a new verification email." },
      { status: 500 }
    );
  }
}
