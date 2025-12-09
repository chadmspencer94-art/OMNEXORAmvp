/**
 * Email Verification Token Helpers
 * 
 * Handles creation, verification, and consumption of email verification tokens.
 * Tokens are hashed with SHA-256 (not bcrypt) for fast lookup.
 */

import { prisma } from "./prisma";
import crypto from "crypto";

export interface EmailVerificationToken {
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
 * Creates a new email verification token for a user
 * @param userId - The user ID to create the token for
 * @returns The raw token string (to be sent in email)
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  // Generate secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  // Set expiry to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Delete any existing tokens for this user first
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  // Create new verification token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Verifies an email verification token without consuming it
 * @param rawToken - The raw token from the email link
 * @returns The token record if valid, null otherwise
 */
export async function verifyEmailVerificationToken(
  rawToken: string
): Promise<EmailVerificationToken | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const token = await prisma.emailVerificationToken.findFirst({
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
 * Consumes an email verification token (verifies and deletes it for single-use)
 * @param rawToken - The raw token from the email link
 * @returns The token record with userId if valid, null otherwise
 */
export async function consumeEmailVerificationToken(
  rawToken: string
): Promise<EmailVerificationToken | null> {
  const token = await verifyEmailVerificationToken(rawToken);

  if (!token) {
    return null;
  }

  // Delete this token (and optionally any others for this user) so it's single-use
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: token.userId },
  });

  return token;
}

