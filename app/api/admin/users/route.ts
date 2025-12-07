import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin, getAllUsers } from "@/lib/auth";

/**
 * GET /api/admin/users
 * Returns all users in the system (admin only)
 */
export async function GET() {
  try {
    // Check authentication and admin status
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Get all users
    const users = await getAllUsers();

    // Return safe user data with all needed fields
    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.email.split("@")[0], // Extract name from email for display
        businessName: user.businessDetails?.businessName,
        role: user.role,
        isAdmin: user.isAdmin ?? false,
        planTier: user.planTier ?? "FREE",
        planStatus: user.planStatus ?? "TRIAL",
        accountStatus: user.accountStatus ?? (user.isBanned ? "BANNED" : "ACTIVE"),
        isBanned: user.isBanned ?? false,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ?? null,
        lastActivityAt: user.lastActivityAt ?? null,
        totalJobs: user.totalJobs ?? 0,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt,
        businessDetails: user.businessDetails,
        trialEndsAt: user.trialEndsAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
