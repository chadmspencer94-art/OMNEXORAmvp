import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAllVerifications, getVerificationsByStatus } from "@/lib/verification";

/**
 * GET /api/admin/verification
 * Returns all verification records, sorted by status (pending first) then createdAt desc
 */
export async function GET() {
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

    const verifications = await getAllVerifications();

    return NextResponse.json({
      verifications,
      counts: {
        pending: verifications.filter((v) => v.status === "pending").length,
        verified: verifications.filter((v) => v.status === "verified").length,
        rejected: verifications.filter((v) => v.status === "rejected").length,
        total: verifications.length,
      },
    });
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
