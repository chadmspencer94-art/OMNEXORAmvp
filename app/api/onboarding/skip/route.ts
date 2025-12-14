import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/onboarding/skip
 * Marks the user's onboarding as skipped (not completed)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user in Prisma
    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Mark onboarding as skipped (not completed)
    await prisma.user.update({
      where: { id: prismaUser.id },
      data: {
        onboardingSkippedAt: new Date(),
        hasSeenOnboarding: true,
        // Do NOT set profileCompletedAt - user can complete onboarding later
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error skipping onboarding:", error);
    return NextResponse.json(
      { error: "Failed to skip onboarding" },
      { status: 500 }
    );
  }
}

