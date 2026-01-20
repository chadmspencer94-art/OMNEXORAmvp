/**
 * User Profile API
 * GET /api/me - Get current user's profile data
 */

import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin as checkIsAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const prisma = getPrisma();

    // Fetch additional user data from Prisma
    let prismaUser = null;
    try {
      prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
          verificationStatus: true,
          role: true,
          businessName: true,
          tradingName: true,
          primaryTrade: true,
          profileCompletedAt: true,
          onboardingDismissed: true,
          onboardingCompletedAt: true,
        },
      });
    } catch (error) {
      console.error("[api/me] Failed to fetch prisma user:", error);
    }

    const isAdmin = checkIsAdmin(user);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      emailVerifiedAt: prismaUser?.emailVerifiedAt || null,
      verificationStatus: prismaUser?.verificationStatus || user.verificationStatus || null,
      role: prismaUser?.role || user.role || null,
      isAdmin,
      businessName: prismaUser?.businessName || null,
      tradingName: prismaUser?.tradingName || null,
      primaryTrade: prismaUser?.primaryTrade || null,
      profileCompletedAt: prismaUser?.profileCompletedAt || null,
      onboardingDismissed: prismaUser?.onboardingDismissed || false,
    });
  } catch (error) {
    console.error("[api/me] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
