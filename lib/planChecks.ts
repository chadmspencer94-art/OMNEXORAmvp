import type { SafeUser } from "./auth";
import { isAdmin } from "./auth";

/**
 * Checks if a user has a paid plan (not FREE tier)
 * @param user - The user to check
 * @returns True if user has a paid plan
 */
export function hasPaidPlan(user: SafeUser | null): boolean {
  if (!user) return false;
  
  // Admin users always have access
  if (isAdmin(user)) {
    return true;
  }
  
  // Check plan tier - FREE is the only unpaid tier
  const planTier = (user as any).planTier || "FREE";
  return planTier !== "FREE";
}

/**
 * Checks if a user is on the FREE plan
 * @param user - The user to check
 * @returns True if user is on FREE plan
 */
export function isFreePlan(user: SafeUser | null): boolean {
  if (!user) return true;
  
  // Admin users are never on free plan
  if (isAdmin(user)) {
    return false;
  }
  
  const planTier = (user as any).planTier || "FREE";
  return planTier === "FREE";
}

