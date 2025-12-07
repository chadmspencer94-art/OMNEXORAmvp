import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Validates reset token and updates user password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find all non-expired reset tokens
    const now = new Date();
    const tokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: true,
      },
    });

    // Find matching token by comparing hash
    let validToken = null;
    let user = null;

    for (const resetToken of tokens) {
      const isValid = await bcrypt.compare(token, resetToken.tokenHash);
      if (isValid) {
        validToken = resetToken;
        user = resetToken.user;
        break;
      }
    }

    if (!validToken || !user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new password reset link." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete the used token (and any other tokens for this user)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reset-password endpoint:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}

