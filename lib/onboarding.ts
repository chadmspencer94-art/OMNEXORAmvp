import type { User } from "@prisma/client";

/**
 * Checks if a user's business profile is complete enough to skip onboarding.
 * 
 * Requirements:
 * - Trading name OR business name present
 * - Primary trade set
 * - At least one work type (residential/commercial/strata)
 * - Service area defined (radius OR postcodes)
 * - Basic pricing filled in (hourlyRate OR at least one m2/lm rate)
 */
export function isBusinessProfileComplete(user: User): boolean {
  // Business name or trading name
  const hasBusinessName = !!(user.businessName || user.tradingName);
  
  // Primary trade
  const hasPrimaryTrade = !!user.primaryTrade;
  
  // At least one work type
  const hasWorkType = user.doesResidential || user.doesCommercial || user.doesStrata;
  
  // Service area (radius OR postcodes)
  const hasServiceArea = 
    (user.serviceRadiusKm !== null && user.serviceRadiusKm > 0) ||
    !!(user.servicePostcodes && user.servicePostcodes.trim().length > 0);
  
  // Basic pricing (hourly rate OR at least one area/linear rate)
  const hasPricing = 
    (user.hourlyRate !== null && user.hourlyRate > 0) ||
    (user.ratePerM2Interior !== null && user.ratePerM2Interior > 0) ||
    (user.ratePerM2Exterior !== null && user.ratePerM2Exterior > 0) ||
    (user.ratePerLmTrim !== null && user.ratePerLmTrim > 0);
  
  return hasBusinessName && hasPrimaryTrade && hasWorkType && hasServiceArea && hasPricing;
}

/**
 * Checks if a user should be redirected to onboarding.
 * Returns true if they need onboarding, false if they can proceed.
 */
export function needsOnboarding(user: User): boolean {
  // Clients don't need onboarding
  if (user.role === "client") {
    return false;
  }
  
  // If profile is already marked as complete, skip onboarding
  if (user.profileCompletedAt) {
    return false;
  }
  
  // If user skipped onboarding, don't force them back
  if (user.onboardingSkippedAt) {
    return false;
  }
  
  // If profile is actually complete but not marked, they don't need onboarding
  // (legacy users who already filled everything out)
  if (isBusinessProfileComplete(user)) {
    return false;
  }
  
  // Otherwise, they need onboarding
  return true;
}

