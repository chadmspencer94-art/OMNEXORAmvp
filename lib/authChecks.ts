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
    const { prisma } = await import("./prisma");
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
