import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { needsOnboarding } from "@/lib/onboarding";

/**
 * GET /api/onboarding/check
 * Checks if the current user needs onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clients don't need onboarding
    if (user.role === "client") {
      return NextResponse.json({
        needsOnboarding: false,
        skipped: false,
      });
    }

    // Find user in Prisma (need all fields for needsOnboarding check)
    // Wrap in try-catch to handle database connection issues gracefully
    let prismaUser;
    try {
      prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
    } catch (dbError) {
      // If database query fails, assume user needs onboarding (safe default)
      console.error("Database error in onboarding check:", dbError);
      return NextResponse.json({
        needsOnboarding: true,
        skipped: false,
      });
    }

    // If user doesn't exist in Prisma yet, treat as needing onboarding
    if (!prismaUser) {
      return NextResponse.json({
        needsOnboarding: true,
        skipped: false,
      });
    }

    // Check onboarding status with error handling
    let needs = true;
    let skipped = false;
    try {
      needs = needsOnboarding(prismaUser);
      skipped = !!prismaUser.onboardingSkippedAt;
    } catch (onboardingError) {
      // If needsOnboarding check fails, default to needing onboarding
      console.error("Error computing onboarding status:", onboardingError);
      needs = true;
      skipped = false;
    }

    return NextResponse.json({
      needsOnboarding: needs,
      skipped,
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}

