// lib/authChecks.ts
import { redirect } from "next/navigation";
import { getCurrentUser, isClient, isAdmin, type SafeUser } from "./auth";

// Re-export isClient for convenience
export { isClient };

// Custom error class for email verification
class EmailNotVerifiedError extends Error {
  name = "EmailNotVerifiedError";
  constructor(message: string = "Email not verified") {
    super(message);
  }
}

// Custom error class for business verification
export class UserNotVerifiedError extends Error {
  name = "UserNotVerifiedError";
  constructor(message: string = "Business verification required") {
    super(message);
  }
}

/**
 * Require that a user is logged in.
 * Redirects to /login if not authenticated.
 */
export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?reason=unauthorised");
  }

  return user;
}

/**
 * Alias for requireAuthenticatedUser for backwards compatibility.
 */
export const requireUser = requireAuthenticatedUser;

/**
 * Require that a user is NOT logged in.
 * Used for /login, /register, etc.
 */
export async function requireUnauthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  redirect("/dashboard");
}

/**
 * Require a logged-in, “onboarded” user.
 * For now we treat any authenticated user as onboarded so the app works.
 */
export async function requireOnboardedUser() {
  const user = await requireAuthenticatedUser();

  // TODO: when you have a real onboarding flag, enforce it here:
  // if (!user.onboardingCompleted) redirect("/onboarding");

  return user;
}

/**
 * Require an admin user for /admin routes.
 */
export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();
  const role = (user as any).role;

  if (role !== "ADMIN" && role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Requires that a user's email is verified.
 * Throws EmailNotVerifiedError if email is not verified.
 * Admin users bypass this check.
 * @param user - The user to check
 * @throws EmailNotVerifiedError if email is not verified
 */
export async function requireVerifiedEmail(user: SafeUser): Promise<void> {
  // Admin users bypass email verification
  if (isAdmin(user)) {
    return;
  }

  // Check if emailVerifiedAt exists on user object (might be added dynamically)
  if ((user as any).emailVerifiedAt) {
    return;
  }

  // Otherwise, check Prisma database
  try {
    const { getPrisma } = await import("./prisma"); const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { emailVerifiedAt: true },
    });

    if (!prismaUser || !prismaUser.emailVerifiedAt) {
      throw new EmailNotVerifiedError("Email not verified");
    }
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof EmailNotVerifiedError) {
      throw error;
    }
    // If database query fails, assume not verified for safety
    throw new EmailNotVerifiedError("Email not verified");
  }
}

/**
 * Requires that a user's business is verified (admin-verified).
 * Throws UserNotVerifiedError if not verified.
 * Admin users bypass this check.
 * 
 * VERIFICATION GATE: All document generation requires business verification.
 * This includes job packs, SWMS, variations, EOT, progress claims, handover, maintenance.
 * 
 * @param user - The user to check
 * @throws UserNotVerifiedError if business is not verified
 */
export async function requireVerifiedUser(user: SafeUser): Promise<void> {
  // Admin users bypass verification
  if (isAdmin(user)) {
    return;
  }

  // Check verificationStatus on user object
  const verificationStatus = user.verificationStatus;
  if (verificationStatus === "verified") {
    return;
  }

  // Double-check against Prisma UserVerification table for accuracy
  try {
    const { getPrisma } = await import("./prisma");
    const prisma = getPrisma();
    
    // Check the UserVerification table
    const verification = await prisma.userVerification.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (verification?.status === "verified") {
      return;
    }

    // Also check the User table verificationStatus field
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { verificationStatus: true },
    });

    if (prismaUser?.verificationStatus === "verified") {
      return;
    }
  } catch (error) {
    // If database query fails, use the user object status
    // Cast to string to handle type variations between auth.ts and prisma
    if ((verificationStatus as string) === "verified") {
      return;
    }
  }

  // User is not verified - throw error with helpful message
  // Cast to string to handle type variations (rejected is a valid status from UserVerification model)
  const status = verificationStatus as string;
  const statusMessage = status === "pending" 
    ? "Your business verification is pending admin review. Please wait for approval before generating documents."
    : status === "rejected"
    ? "Your business verification was rejected. Please update your details and resubmit for review."
    : "Business verification is required before generating documents. Please submit your verification details in Settings > Verification.";
  
  throw new UserNotVerifiedError(statusMessage);
}

/**
 * Checks if a user is verified (without throwing).
 * Returns true if verified or admin, false otherwise.
 * @param user - The user to check
 * @returns boolean indicating if user is verified
 */
export function isUserVerified(user: SafeUser | null): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.verificationStatus === "verified";
}
