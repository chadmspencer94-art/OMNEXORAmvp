import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { calculateBusinessScore, type BusinessScoreBreakdown } from "@/lib/businessScore";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/me/advanced-analytics
 * Returns comprehensive business analytics and score for the current user
 * Premium feature - only accessible by tradie/business/builder users
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Clients don't have business analytics
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Business analytics not available for client accounts" },
        { status: 403 }
      );
    }

    // Get Prisma user ID
    const prisma = getPrisma();
    let prismaUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          { email: user.email }
        ]
      },
      select: { id: true }
    });

    // Create user in Prisma if doesn't exist
    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          passwordHash: "",
          role: user.role || "tradie",
        },
        select: { id: true }
      });
    }

    // Calculate business score
    const analytics = await calculateBusinessScore(prismaUser.id);

    // Store the score in database for future reference
    try {
      await prisma.user.update({
        where: { id: prismaUser.id },
        data: {
          businessScore: analytics.totalScore,
          businessScoreUpdatedAt: new Date(),
        }
      });
    } catch (updateError) {
      // Non-critical - continue even if we can't store the score
      console.warn("Failed to store business score:", updateError);
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching advanced analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/me/advanced-analytics/refresh
 * Force recalculation of business score
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (isClient(user)) {
      return NextResponse.json(
        { error: "Business analytics not available for client accounts" },
        { status: 403 }
      );
    }

    const prisma = getPrisma();
    let prismaUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          { email: user.email }
        ]
      },
      select: { id: true }
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Force recalculation
    const analytics = await calculateBusinessScore(prismaUser.id);

    // Store the refreshed score
    await prisma.user.update({
      where: { id: prismaUser.id },
      data: {
        businessScore: analytics.totalScore,
        businessScoreUpdatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Error refreshing analytics:", error);
    return NextResponse.json(
      { error: "Failed to refresh analytics" },
      { status: 500 }
    );
  }
}
