/**
 * Authentication and authorization helper functions
 * Used for gating features based on user verification status
 */

import { prisma } from "./prisma";
import type { SafeUser } from "./auth";

export class EmailNotVerifiedError extends Error {
  constructor(message: string = "EMAIL_NOT_VERIFIED") {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Requires that the user's email is verified
 * Throws EmailNotVerifiedError if not verified
 * 
 * @param user - The user object (from getCurrentUser or similar)
 * @throws EmailNotVerifiedError if email is not verified
 */
export async function requireVerifiedEmail(user: SafeUser): Promise<void> {
  // Load fresh data from Prisma to check emailVerifiedAt
  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { emailVerifiedAt: true },
  });

  if (!prismaUser?.emailVerifiedAt) {
    throw new EmailNotVerifiedError("EMAIL_NOT_VERIFIED");
  }
}

/**
 * Checks if a user's email is verified (non-throwing version)
 * 
 * @param user - The user object
 * @returns true if email is verified, false otherwise
 */
export async function isEmailVerified(user: SafeUser): Promise<boolean> {
  try {
    await requireVerifiedEmail(user);
    return true;
  } catch {
    return false;
  }
}

