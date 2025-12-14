import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/password-reset";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Validates reset token and updates user password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

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

    if (!confirmPassword || typeof confirmPassword !== "string") {
      return NextResponse.json(
        { error: "Password confirmation is required" },
        { status: 400 }
      );
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Password validation (same as registration: minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Consume the token (verifies and deletes it for single-use)
    const resetToken = await consumePasswordResetToken(token);

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Get the user
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password using the same method as registration (bcrypt, 12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Optionally clear any existing sessions for that user
    // (If you have session storage, clear it here)

    return NextResponse.json(
      { success: true },
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

