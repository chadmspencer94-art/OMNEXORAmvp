import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/me/onboarding/dismiss
 * Dismisses the onboarding checklist for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find user in Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { email: currentUser.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user to mark onboarding as dismissed
    await prisma.user.update({
      where: { id: prismaUser.id },
      data: {
        onboardingDismissed: true,
        onboardingCompletedAt: new Date(), // Set completion date when dismissed
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error dismissing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to dismiss onboarding" },
      { status: 500 }
    );
  }
}

