import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { updateVerificationStatus, getUserVerification } from "@/lib/verification";
import type { VerificationStatus } from "@/lib/verification";

/**
 * POST /api/admin/verification/[userId]/status
 * Admin-only: Updates verification status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await getCurrentUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { status, adminNotes, rejectionReason } = body;

    if (!status || !["pending", "verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (pending/verified/rejected) is required" },
        { status: 400 }
      );
    }

    // Validate rejection reason if rejecting
    if (status === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting verification" },
        { status: 400 }
      );
    }

    // Check verification exists
    const verification = await getUserVerification(userId);
    if (!verification) {
      return NextResponse.json(
        { error: "Verification record not found" },
        { status: 404 }
      );
    }

    // Update status
    await updateVerificationStatus(userId, status as VerificationStatus, {
      adminNotes: adminNotes || null,
      rejectionReason: status === "rejected" ? rejectionReason : null,
      reviewerId: adminUser.id,
    });

    return NextResponse.json({
      success: true,
      message: `Verification ${status}`,
    });
  } catch (error) {
    console.error("Error updating verification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

