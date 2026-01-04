/**
 * Onboarding Status Helper
 * 
 * Computes onboarding status for tradie/business users by inspecting actual data.
 * This ensures onboarding progress reflects real completion, not just flags.
 */

import { getPrisma } from "./prisma";
import { User } from "@prisma/client";
import { getJobsForUser } from "./jobs";

export type OnboardingStepKey =
  | "businessProfile"
  | "rates"
  | "serviceArea"
  | "verification"
  | "firstJob";

export type OnboardingStep = {
  key: OnboardingStepKey;
  label: string;
  description: string;
  href: string; // link to the relevant page
  done: boolean;
};

export type OnboardingStatus = {
  steps: OnboardingStep[];
  allDone: boolean;
  dismissed: boolean;
};

/**
 * Partial user type for onboarding status computation
 */
type OnboardingUserInput = Pick<
  User,
  | "id"
  | "role"
  | "businessName"
  | "tradingName"
  | "primaryTrade"
  | "abn"
  | "hourlyRate"
  | "calloutFee"
  | "ratePerM2Interior"
  | "ratePerM2Exterior"
  | "ratePerLmTrim"
  | "serviceAreaCity"
  | "serviceRadiusKm"
  | "servicePostcodes"
  | "verificationStatus"
  | "onboardingDismissed"
>;

/**
 * Computes onboarding status for a user by inspecting actual data
 */
export async function getOnboardingStatus(user: OnboardingUserInput): Promise<OnboardingStatus> {
  // Check if user has business profile fields set
  const hasBusinessProfile =
    !!(user.businessName || user.tradingName) &&
    !!user.primaryTrade &&
    !!user.abn;

  // Check if user has rates configured
  const hasRates =
    user.hourlyRate != null ||
    user.calloutFee != null ||
    user.ratePerM2Interior != null ||
    user.ratePerM2Exterior != null ||
    user.ratePerLmTrim != null;

  // Check if user has service area configured
  const hasServiceArea =
    user.serviceAreaCity != null ||
    user.serviceRadiusKm != null ||
    (user.servicePostcodes != null && user.servicePostcodes.trim() !== "");

  // Check verification status
  const isVerified =
    user.verificationStatus === "verified" ||
    user.verificationStatus === "approved";

  // Check if user has created at least one job
  // Jobs are stored in KV, so we need to use the jobs helper
  const jobs = await getJobsForUser(user.id);
  const hasFirstJob = jobs.length > 0;

  const steps: OnboardingStep[] = [
    {
      key: "businessProfile",
      label: "Set up your business profile",
      description: "Add your business name, ABN, trade type and basic details.",
      href: "/settings/business-profile",
      done: hasBusinessProfile,
    },
    {
      key: "rates",
      label: "Configure your rates & pricing",
      description: "Set your hourly/day rate and typical m² rates so quotes are accurate.",
      href: "/settings/business-profile", // Rates are on business profile page
      done: hasRates,
    },
    {
      key: "serviceArea",
      label: "Set your service area",
      description: "Tell OMNEXORA where you work so matching and admin are accurate.",
      href: "/settings/business-profile", // Service area lives there
      done: hasServiceArea,
    },
    {
      key: "verification",
      label: "Submit verification details",
      description: "Add ABN/licence details so you can show as a structured business.",
      href: "/settings/verification",
      done: isVerified,
    },
    {
      key: "firstJob",
      label: "Create your first job & job pack",
      description: "Run one real job through OMNEXORA to see the full workflow.",
      href: "/jobs/new",
      done: hasFirstJob,
    },
  ];

  const allDone = steps.every((s) => s.done);

  return {
    steps,
    allDone,
    dismissed: user.onboardingDismissed || false,
  };
}

/**
 * Updates the onboarding snapshot flags on the User model
 * This can be called after steps are completed to persist progress
 */
export async function updateOnboardingSnapshot(userId: string): Promise<void> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const status = await getOnboardingStatus(user);

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingBusinessProfileDone: status.steps.find((s) => s.key === "businessProfile")?.done ?? false,
      onboardingRatesDone: status.steps.find((s) => s.key === "rates")?.done ?? false,
      onboardingServiceAreaDone: status.steps.find((s) => s.key === "serviceArea")?.done ?? false,
      onboardingVerificationDone: status.steps.find((s) => s.key === "verification")?.done ?? false,
      onboardingFirstJobDone: status.steps.find((s) => s.key === "firstJob")?.done ?? false,
      onboardingCompletedAt: status.allDone ? (user.onboardingCompletedAt ?? new Date()) : user.onboardingCompletedAt,
    },
  });
}

