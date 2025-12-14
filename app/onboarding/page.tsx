import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authChecks";
import { getPrisma } from "@/lib/prisma";
import { needsOnboarding, isBusinessProfileComplete } from "@/lib/onboarding";
import OnboardingWizard from "./OnboardingWizard";

// Authenticated page using requireUser and Prisma - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function OnboardingPage() {
  const user = await requireUser();

  console.log("[onboarding] onboarding page accessed by user", user?.id);

  // Clients don't need onboarding
  if (user.role === "client") {
    redirect("/client/dashboard");
  }

  // Fetch full user from Prisma with error handling
  const prisma = getPrisma();
  let prismaUser;
  try {
    prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
  } catch (error) {
    // If database query fails, redirect to login for safety
    console.error("[onboarding] Failed to fetch user from Prisma in onboarding:", error);
    redirect("/login?reason=unauthorised");
  }

  if (!prismaUser) {
    console.log("[onboarding] user not found in Prisma, redirecting to login");
    redirect("/login?reason=unauthorised");
  }

  // If profile is already complete, redirect to dashboard
  if (prismaUser.profileCompletedAt || isBusinessProfileComplete(prismaUser)) {
    // Auto-complete for legacy users
    if (!prismaUser.profileCompletedAt && isBusinessProfileComplete(prismaUser)) {
      try {
        await prisma.user.update({
          where: { id: prismaUser.id },
          data: { profileCompletedAt: new Date() },
        });
      } catch (error) {
        // If update fails, log but continue - user can still proceed
        console.error("[onboarding] Failed to update profileCompletedAt:", error);
      }
    }
    redirect("/dashboard");
  }

  // Fetch current business profile data
  const businessProfile = {
    businessName: prismaUser.businessName,
    tradingName: prismaUser.tradingName,
    abn: prismaUser.abn,
    primaryTrade: prismaUser.primaryTrade,
    tradeTypes: prismaUser.tradeTypes,
    doesResidential: prismaUser.doesResidential,
    doesCommercial: prismaUser.doesCommercial,
    doesStrata: prismaUser.doesStrata,
    serviceRadiusKm: prismaUser.serviceRadiusKm,
    servicePostcodes: prismaUser.servicePostcodes,
    hourlyRate: prismaUser.hourlyRate,
    calloutFee: prismaUser.calloutFee,
    ratePerM2Interior: prismaUser.ratePerM2Interior,
    ratePerM2Exterior: prismaUser.ratePerM2Exterior,
    ratePerLmTrim: prismaUser.ratePerLmTrim,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to OMNEXORA</h1>
          <p className="text-lg text-slate-600">
            Let&apos;s get your business profile set up so you can start creating AI job packs.
          </p>
        </div>
        <OnboardingWizard initialData={businessProfile} />
      </div>
    </div>
  );
}

