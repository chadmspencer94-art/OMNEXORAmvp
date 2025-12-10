/**
 * Authentication and authorization helper functions
 * Used for gating features based on user verification status
 */

import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { SafeUser } from "./auth";
import { getCurrentUser, isClient } from "./auth";
import { needsOnboarding } from "./onboarding";

// Re-export isClient for convenience
export { isClient };

export class EmailNotVerifiedError extends Error {
  constructor(message: string = "EMAIL_NOT_VERIFIED") {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Requires that the user is authenticated
 * Redirects to login if not authenticated
 * 
 * @returns The authenticated user (never null, redirects if not authenticated)
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login?reason=unauthorised");
    return null as never;
  }
  
  return user;
}

/**
 * Requires that the user is authenticated and has completed onboarding
 * Redirects to login if not authenticated, or to onboarding if not onboarded
 * 
 * @returns The authenticated and onboarded user (never null, redirects if needed)
 */
export async function requireOnboardedUser(): Promise<SafeUser> {
  const user = await requireUser();
  
  // Clients don't need onboarding
  if (user.role === "client") {
    return user;
  }
  
  // Check onboarding status from Prisma
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
    
    if (!prismaUser) {
      // User not found in Prisma - redirect to onboarding
      redirect("/onboarding");
      return null as never;
    }
    
    // Check if user needs onboarding
    if (needsOnboarding(prismaUser)) {
      redirect("/onboarding");
      return null as never;
    }
    
    return user;
  } catch (error) {
    // If database query fails, assume user needs onboarding (safe default)
    console.error("[authChecks] Error checking onboarding status:", error);
    redirect("/onboarding");
    return null as never;
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

