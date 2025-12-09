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
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const needs = needsOnboarding(prismaUser);
    const skipped = !!prismaUser.onboardingSkippedAt;

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

