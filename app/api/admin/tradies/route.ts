import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/admin/tradies
 * Admin-only endpoint to list all active tradie/business users
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check - admin only
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      );
    }

    // Fetch all active tradie/business users
    const prisma = getPrisma();
    const tradies = await prisma.user.findMany({
      where: {
        role: {
          in: ["tradie", "builder", "business", "supplier"],
        },
        isBanned: false,
        accountStatus: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        tradingName: true,
        primaryTrade: true,
      },
      orderBy: [
        { tradingName: "asc" },
        { businessName: "asc" },
        { email: "asc" },
      ],
    });

    return NextResponse.json({
      tradies: tradies.map((t) => ({
        id: t.id,
        email: t.email,
        businessName: t.tradingName || t.businessName,
        primaryTrade: t.primaryTrade,
      })),
    });
  } catch (error) {
    console.error("Error fetching tradies:", error);
    return NextResponse.json(
      { error: "Failed to fetch tradies" },
      { status: 500 }
    );
  }
}

