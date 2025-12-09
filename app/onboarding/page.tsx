import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { needsOnboarding, isBusinessProfileComplete } from "@/lib/onboarding";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const user = await requireActiveUser("/onboarding");

  // Clients don't need onboarding
  if (user.role === "client") {
    redirect("/dashboard");
  }

  // Fetch full user from Prisma
  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!prismaUser) {
    redirect("/login");
  }

  // If profile is already complete, redirect to dashboard
  if (prismaUser.profileCompletedAt || isBusinessProfileComplete(prismaUser)) {
    // Auto-complete for legacy users
    if (!prismaUser.profileCompletedAt && isBusinessProfileComplete(prismaUser)) {
      await prisma.user.update({
        where: { id: prismaUser.id },
        data: { profileCompletedAt: new Date() },
      });
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

