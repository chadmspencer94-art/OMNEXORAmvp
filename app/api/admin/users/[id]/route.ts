import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, updateUser, getUserById } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

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
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    // Await params (Next.js 16+ requires params to be a Promise)
    const params = await context.params;
    const userId = params.id;

    console.log(`[Admin API] Updating user with ID: ${userId}`);

    // Get the user to update from KV store (primary source)
    let targetUser = await getUserById(userId);
    let actualUserId = userId; // Default to route param ID
    
    if (!targetUser) {
      console.error(`[Admin API] User ${userId} not found in KV store. Attempting fallback lookup...`);
      
      // Fallback: Try to find user by checking if this is a Prisma ID
      // and then look up the corresponding KV user by email
      const prisma = getPrisma();
      try {
        const prismaUser = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (prismaUser) {
          console.log(`[Admin API] Found user in Prisma: ${prismaUser.email}, looking up in KV...`);
          // Try to find in KV by email
          const { kv } = await import("@/lib/kv");
          const kvUser = (await kv.get(`user:email:${prismaUser.email.toLowerCase()}`)) as any;
          if (kvUser && kvUser.id) {
            console.log(`[Admin API] Found KV user with ID: ${kvUser.id}`);
            targetUser = await getUserById(kvUser.id);
            if (targetUser) {
              // Use the KV user ID for updates
              actualUserId = targetUser.id;
            }
          }
        }
      } catch (prismaError) {
        console.warn("[Admin API] Could not check Prisma for user:", prismaError);
      }
    } else {
      // User found in KV, use their ID
      actualUserId = targetUser.id;
    }
    
    if (!targetUser) {
      console.error(`[Admin API] User ${userId} not found in either KV store or Prisma`);
      return NextResponse.json(
        { error: `User not found. User ID: ${userId}. Please ensure the user exists in the system.` },
        { status: 404 }
      );
    }
    
    console.log(`[Admin API] Found user: ${targetUser.email} (KV ID: ${actualUserId}), current role: ${targetUser.role}, isAdmin: ${targetUser.isAdmin ?? false}`);

    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Prevent admin from removing their own admin status
    // Check both the route param ID and the actual user ID
    if ((currentUser.id === userId || currentUser.id === actualUserId) && body.isAdmin === false) {
      return NextResponse.json(
        { error: "You cannot remove your own admin status" },
        { status: 400 }
      );
    }
    const updates: {
      isAdmin?: boolean;
      role?: "admin" | "tradie" | "builder" | "client" | "supplier";
      verificationStatus?: "unverified" | "pending" | "verified";
      verifiedAt?: string | null;
      planStatus?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
      planTier?: "FREE" | "TRIAL" | "FOUNDER" | "PRO" | "BUSINESS";
      trialEndsAt?: string | null;
    } = {};

    // Only include fields that are actually provided (not undefined)
    if (typeof body.isAdmin === "boolean") {
      updates.isAdmin = body.isAdmin;
      // If making admin, also set role to "admin" and auto-verify (admins don't need business verification)
      if (body.isAdmin === true) {
        updates.role = "admin";
        updates.verificationStatus = "verified";
        // Set verifiedAt if not already set
        if (!targetUser.verifiedAt) {
          updates.verifiedAt = new Date().toISOString();
        }
      } else {
        // If removing admin, reset role to "tradie" (default non-admin role)
        // Keep verification status as-is (don't remove verification)
        updates.role = "tradie";
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

    // Update the user in KV store using the actual KV user ID
    console.log(`[Admin API] Updating user ${actualUserId} with updates:`, updates);
    const updatedUser = await updateUser(actualUserId, updates);
    if (!updatedUser) {
      console.error(`[Admin API] Failed to update user ${actualUserId} in KV store. updateUser returned null.`);
      return NextResponse.json(
        { error: `Failed to update user in database. User ID: ${actualUserId}` },
        { status: 500 }
      );
    }
    
    console.log(`[Admin API] Successfully updated user in KV store: ${updatedUser.email}, role: ${updatedUser.role}, isAdmin: ${updatedUser.isAdmin}`);

    // Also update Prisma if user exists there (for role and admin status)
    if (updates.role || updates.isAdmin !== undefined) {
      const prisma = getPrisma();
      try {
        // Find user by email (since KV and Prisma may use different IDs)
        const prismaUser = await prisma.user.findUnique({
          where: { email: targetUser.email },
        });

        if (prismaUser) {
          // Update Prisma user - always update role to match KV store
          await prisma.user.update({
            where: { id: prismaUser.id },
            data: {
              role: updates.role || (updates.isAdmin === false ? "tradie" : prismaUser.role),
              // Note: Prisma User model doesn't have isAdmin field, but role="admin" is sufficient
            },
          });
        }
      } catch (prismaError) {
        // Log but don't fail - KV update succeeded
        console.warn("Failed to update Prisma user (non-critical):", prismaError);
      }
    }

    // Return the updated user (safe, without password hash)
    // Re-fetch to ensure we have the latest normalized data
    let finalUser = await getUserById(actualUserId);
    
    // If still not found, use the updatedUser from updateUser response
    if (!finalUser) {
      finalUser = await getUserById(updatedUser.id);
    }
    
    const safeUser = finalUser ? (() => {
      const { passwordHash: _, ...safe } = finalUser!;
      return safe;
    })() : updatedUser;

    // Ensure isAdmin is properly set based on role if not explicitly set
    const isAdminValue = safeUser.isAdmin ?? (safeUser.role === "admin");

    console.log(`[Admin API] Update complete. User: ${safeUser.email}, role: ${safeUser.role}, isAdmin: ${isAdminValue}`);

    return NextResponse.json({
      success: true,
      user: {
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
        verificationStatus: safeUser.verificationStatus,
        verifiedAt: safeUser.verifiedAt,
        isAdmin: isAdminValue,
        planTier: safeUser.planTier,
        planStatus: safeUser.planStatus,
        trialEndsAt: safeUser.trialEndsAt,
        lastLoginAt: safeUser.lastLoginAt,
        lastActivityAt: safeUser.lastActivityAt,
        totalJobs: safeUser.totalJobs,
        totalJobPacks: safeUser.totalJobPacks,
        businessDetails: safeUser.businessDetails,
        createdAt: safeUser.createdAt,
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

