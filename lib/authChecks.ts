// lib/authChecks.ts
import { redirect } from "next/navigation";
import { getCurrentUser, isClient } from "./auth";

// Re-export isClient for convenience
export { isClient };

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
