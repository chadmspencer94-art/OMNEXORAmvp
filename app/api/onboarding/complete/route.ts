import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/onboarding/complete
 * Marks the user's onboarding as complete
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

    // Mark onboarding as complete
    await prisma.user.update({
      where: { id: prismaUser.id },
      data: {
        profileCompletedAt: new Date(),
        hasSeenOnboarding: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

