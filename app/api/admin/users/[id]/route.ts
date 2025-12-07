import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, updateUser, getUserById } from "@/lib/auth";

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * PATCH /api/admin/users/[id]
 * Update a user's admin status, plan status, plan tier, or trial end date.
 * Only accessible by admins.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  // Type assertion: treat params as direct object (not Promise) per requirements
  // This satisfies Next.js type checking while allowing direct access to params.id
  const params = context.params as unknown as { id: string };
  
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

    // Get the user to update - params.id is directly accessible (not awaited)
    const userId = params.id;
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent admin from removing their own admin status
    if (currentUser.id === userId) {
      const body = await request.json().catch(() => ({}));
      if (body.isAdmin === false) {
        return NextResponse.json(
          { error: "You cannot remove your own admin status" },
          { status: 400 }
        );
      }
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const updates: {
      isAdmin?: boolean;
      role?: "admin" | "tradie" | "builder" | "client" | "supplier";
      planStatus?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
      planTier?: "FREE" | "TRIAL" | "FOUNDER" | "PRO" | "BUSINESS";
      trialEndsAt?: string | null;
    } = {};

    // Only include fields that are actually provided (not undefined)
    if (typeof body.isAdmin === "boolean") {
      updates.isAdmin = body.isAdmin;
      // If making admin, also set role to "admin"
      if (body.isAdmin === true) {
        updates.role = "admin";
      }
    }

    if (typeof body.planStatus === "string") {
      // Validate plan status (mapping SUSPENDED to CANCELLED for compatibility)
      const validStatuses = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "SUSPENDED"];
      if (validStatuses.includes(body.planStatus)) {
        // Map SUSPENDED to CANCELLED since it's not in the PlanStatus type
        updates.planStatus = body.planStatus === "SUSPENDED" ? "CANCELLED" : (body.planStatus as "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED");
      }
    }

    if (typeof body.planTier === "string") {
      const validTiers = ["FREE", "TRIAL", "FOUNDER", "PRO", "BUSINESS"];
      if (validTiers.includes(body.planTier)) {
        updates.planTier = body.planTier as "FREE" | "TRIAL" | "FOUNDER" | "PRO" | "BUSINESS";
      }
    }

    if (body.trialEndsAt !== undefined) {
      // Allow null or ISO date string
      if (body.trialEndsAt === null) {
        updates.trialEndsAt = null;
      } else if (typeof body.trialEndsAt === "string") {
        // Validate it's a valid date
        const date = new Date(body.trialEndsAt);
        if (!isNaN(date.getTime())) {
          updates.trialEndsAt = date.toISOString();
        }
      }
    }

    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the user
    const updatedUser = await updateUser(userId, updates);
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Return the updated user (safe, without password hash)
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        verificationStatus: updatedUser.verificationStatus,
        verifiedAt: updatedUser.verifiedAt,
        isAdmin: updatedUser.isAdmin,
        planTier: updatedUser.planTier,
        planStatus: updatedUser.planStatus,
        trialEndsAt: updatedUser.trialEndsAt,
        lastLoginAt: updatedUser.lastLoginAt,
        lastActivityAt: updatedUser.lastActivityAt,
        totalJobs: updatedUser.totalJobs,
        totalJobPacks: updatedUser.totalJobPacks,
        businessDetails: updatedUser.businessDetails,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

