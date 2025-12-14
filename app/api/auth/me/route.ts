import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.log("[auth] /api/auth/me: no user found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    console.log("[auth] /api/auth/me: returning user data for", user.id);
    
    // Get plan tier from Prisma
    let planTier = "FREE";
    try {
      const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { planTier: true },
      });
      if (prismaUser?.planTier) {
        planTier = prismaUser.planTier;
      }
    } catch (error) {
      console.warn("[auth] Failed to fetch plan tier:", error);
    }
    
    // Return safe user data including role, verification status, admin flag, and pricing settings
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role || "tradie", // Default for older users
        verificationStatus: user.verificationStatus || "unverified", // Default for older users
        verifiedAt: user.verifiedAt ?? null,
        isAdmin: user.isAdmin ?? false,
        businessDetails: user.businessDetails,
        hourlyRate: user.hourlyRate ?? null,
        dayRate: user.dayRate ?? null,
        materialMarkupPercent: user.materialMarkupPercent ?? null,
        roughEstimateOnly: user.roughEstimateOnly ?? null,
        planTier: planTier,
      },
    });
  } catch (error) {
    console.error("[auth] Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

