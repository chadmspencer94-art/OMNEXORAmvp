/**
 * Password Reset Token Helpers
 * 
 * Handles creation, verification, and consumption of password reset tokens.
 * Tokens are hashed with SHA-256 (not bcrypt) for fast lookup.
 */

import { prisma } from "./prisma";
import crypto from "crypto";

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Hashes a raw token using SHA-256
 */
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a new password reset token for a user
 * @param userId - The user ID to create the token for
 * @returns The raw token string (to be sent in email)
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Generate secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  // Set expiry to 60 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 60);

  // Delete any existing tokens for this user first
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  // Create new reset token
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Verifies a password reset token without consuming it
 * @param rawToken - The raw token from the email link
 * @returns The token record if valid, null otherwise
 */
export async function verifyPasswordResetToken(
  rawToken: string
): Promise<PasswordResetToken | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: now,
      },
    },
  });

  return token;
}

/**
 * Consumes a password reset token (verifies and deletes it for single-use)
 * @param rawToken - The raw token from the email link
 * @returns The token record with userId if valid, null otherwise
 */
export async function consumePasswordResetToken(
  rawToken: string
): Promise<PasswordResetToken | null> {
  const token = await verifyPasswordResetToken(rawToken);

  if (!token) {
    return null;
  }

  // Delete this token (and optionally any others for this user) so it's single-use
  await prisma.passwordResetToken.deleteMany({
    where: { userId: token.userId },
  });

  return token;
}

