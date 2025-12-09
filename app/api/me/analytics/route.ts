import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getUserJobAnalytics } from "@/lib/analytics";

/**
 * GET /api/me/analytics
 * Returns job analytics for the current user
 * Only accessible by tradie/business/builder users (not clients)
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

    // Return minimal data for clients (they have their own dashboard)
    if (isClient(user)) {
      return NextResponse.json({
        totalJobs: 0,
        jobsLast30Days: 0,
        jobsLast7Days: 0,
        quoteCounts: {
          draft: 0,
          sent: 0,
          accepted: 0,
          declined: 0,
          cancelled: 0,
        },
      });
    }

    // Compute analytics for tradie/business users
    const analytics = await getUserJobAnalytics(user.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

