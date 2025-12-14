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

    // Consume the token (verifies and deletes it for single-use)
    const verificationToken = await consumeEmailVerificationToken(token);

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 400 }
      );
    }

    // Get the user
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: verificationToken.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user's emailVerifiedAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
      },
    });

    // Also update KV store if user exists there
    try {
      const { kv } = await import("@/lib/kv");
      const kvUser = await kv.get<any>(`user:email:${user.email.toLowerCase()}`);
      if (kvUser) {
        kvUser.emailVerifiedAt = new Date().toISOString();
        await kv.set(`user:id:${kvUser.id}`, kvUser);
        await kv.set(`user:email:${user.email.toLowerCase()}`, kvUser);
      }
    } catch (kvError) {
      console.warn("Failed to update KV store with emailVerifiedAt (non-critical):", kvError);
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in verify-email endpoint:", error);
    return NextResponse.json(
      { error: "Failed to verify email. Please try again." },
      { status: 500 }
    );
  }
}

