/**
 * Admin Stats API
 * GET /api/admin/stats - Get quick admin stats for dashboard
 */

import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const prisma = getPrisma();

    // Get pending verifications count
    let pendingVerifications = 0;
    try {
      const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM user_verifications 
        WHERE status = 'pending_review'
      `;
      pendingVerifications = Number(result[0]?.count || 0);
    } catch {
      // Table might not exist yet
    }

    // Get unresolved feedback count
    let unresolvedFeedback = 0;
    try {
      const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM feedbacks 
        WHERE resolved = FALSE OR resolved IS NULL
      `;
      unresolvedFeedback = Number(result[0]?.count || 0);
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({
      pendingVerifications,
      unresolvedFeedback,
    });
  } catch (error) {
    console.error("[admin-stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
