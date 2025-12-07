import { NextResponse } from "next/server";
import {
  getCurrentUser,
  getUsersByVerificationStatus,
  updateUser,
  removeUserFromVerificationIndex,
  getSafeUserById,
  isAdmin,
} from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

// GET - Fetch all pending verification users
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

    // Get users with pending status (map legacy "pending_review" to "pending")
    const pendingReviewUsers = await getUsersByVerificationStatus("pending");

    return NextResponse.json({
      users: pendingReviewUsers,
      counts: {
        pendingReview: pendingReviewUsers.length,
        total: pendingReviewUsers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Approve or reject a verification
export async function POST(request: Request) {
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

    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (approve/reject) is required" },
        { status: 400 }
      );
    }

    // Get the user to verify
    const targetUser = await getSafeUserById(userId);

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Accept both "pending" and legacy "pending_review" status
    const status = targetUser.verificationStatus as string;
    if (status !== "pending" && status !== "pending_review") {
      return NextResponse.json(
        { error: "User is not pending verification review" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update user to verified
      const updatedUser = await updateUser(userId, {
        verificationStatus: "verified",
        verifiedAt: new Date().toISOString(),
        businessDetails: {
          ...targetUser.businessDetails,
          verificationReviewedAt: new Date().toISOString(),
        },
      });

      // Remove from pending index (handle both new and legacy status)
      await removeUserFromVerificationIndex(userId, "pending");
      // Also try legacy status for backwards compatibility
      try {
        await removeUserFromVerificationIndex(userId, "pending_review" as any);
      } catch {
        // Ignore if legacy index doesn't exist
      }

      // Log approval
      console.log(`[ADMIN] User ${targetUser.email} verified by ${adminUser.email}`);

      // Send approval notification
      if (updatedUser) {
        await sendNotification("tradie_verification_approved", {
          user: updatedUser,
          businessDetails: updatedUser.businessDetails,
        });
      }

      return NextResponse.json({
        success: true,
        message: "User verification approved",
      });
    } else {
      // Reject
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      // Update user to unverified (rejected maps to unverified in simplified system)
      const updatedUser = await updateUser(userId, {
        verificationStatus: "unverified",
        verifiedAt: null,
        businessDetails: {
          ...targetUser.businessDetails,
          verificationReviewedAt: new Date().toISOString(),
          verificationRejectionReason: reason.trim(),
        },
      });

      // Remove from pending index (handle both new and legacy status)
      await removeUserFromVerificationIndex(userId, "pending");
      // Also try legacy status for backwards compatibility
      try {
        await removeUserFromVerificationIndex(userId, "pending_review" as any);
      } catch {
        // Ignore if legacy index doesn't exist
      }

      // Log rejection
      console.log(`[ADMIN] User ${targetUser.email} rejected by ${adminUser.email}. Reason: ${reason.trim()}`);

      // Send rejection notification
      if (updatedUser) {
        await sendNotification("tradie_verification_rejected", {
          user: updatedUser,
          businessDetails: updatedUser.businessDetails,
          rejectionReason: reason.trim(),
        });
      }

      return NextResponse.json({
        success: true,
        message: "User verification rejected",
      });
    }
  } catch (error) {
    console.error("Error processing verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
