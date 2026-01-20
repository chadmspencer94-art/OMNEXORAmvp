/**
 * Onboarding Status API
 * GET /api/onboarding/status - Get current user's onboarding status
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/onboarding-status";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const prisma = getPrisma();

    // Fetch full user data from Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        role: true,
        businessName: true,
        tradingName: true,
        primaryTrade: true,
        abn: true,
        hourlyRate: true,
        calloutFee: true,
        ratePerM2Interior: true,
        ratePerM2Exterior: true,
        ratePerLmTrim: true,
        serviceAreaCity: true,
        serviceRadiusKm: true,
        servicePostcodes: true,
        verificationStatus: true,
        onboardingDismissed: true,
      },
    });

    if (!prismaUser) {
      return NextResponse.json({ 
        steps: [],
        allDone: true,
        dismissed: true,
      });
    }

    // Don't show onboarding for clients or admins
    if (prismaUser.role === "client" || user.isAdmin) {
      return NextResponse.json({ 
        steps: [],
        allDone: true,
        dismissed: true,
      });
    }

    const status = await getOnboardingStatus(prismaUser);

    return NextResponse.json(status);
  } catch (error) {
    console.error("[api/onboarding/status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}
