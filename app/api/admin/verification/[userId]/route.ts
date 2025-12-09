import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getUserVerification } from "@/lib/verification";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/verification/[userId]
 * Returns the full verification record for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // Get verification record
    const verification = await getUserVerification(userId);
    if (!verification) {
      return NextResponse.json(
        { error: "Verification record not found" },
        { status: 404 }
      );
    }

    // Get user details
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      verification,
      user: userRecord,
    });
  } catch (error) {
    console.error("Error fetching verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

