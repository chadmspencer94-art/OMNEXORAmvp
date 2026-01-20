import { getPrisma } from "./prisma";
import type { UserVerification } from "@prisma/client";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface UserVerificationData {
  // Business details
  businessName?: string | null;
  abn?: string | null;
  primaryTrade?: string | null;
  workTypes?: string | null;
  
  // Licence
  licenceNumber?: string | null;
  licenceType?: string | null;
  licenceExpiry?: Date | string | null;
  
  // Insurance
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceExpiry?: Date | string | null;
  insuranceCoverageNotes?: string | null;
  
  // Evidence URLs
  abnEvidenceUrl?: string | null;
  licenceEvidenceUrl?: string | null;
  insuranceEvidenceUrl?: string | null;
}

/**
 * Gets the verification record for a user, or returns a default object if none exists
 */
export async function getUserVerification(userId: string): Promise<UserVerification | null> {
  const prisma = getPrisma();
  return prisma.userVerification.findUnique({
    where: { userId },
  });
}

/**
 * Creates or updates a user's verification record (user-facing submission)
 * Does NOT change status - that's admin-only
 */
export async function upsertUserVerification(
  userId: string,
  data: UserVerificationData
): Promise<UserVerification> {
  // Parse dates if provided as strings
  const licenceExpiry = data.licenceExpiry
    ? typeof data.licenceExpiry === "string"
      ? new Date(data.licenceExpiry)
      : data.licenceExpiry
    : null;
  
  const insuranceExpiry = data.insuranceExpiry
    ? typeof data.insuranceExpiry === "string"
      ? new Date(data.insuranceExpiry)
      : data.insuranceExpiry
    : null;

  const prisma = getPrisma();
  return prisma.userVerification.upsert({
    where: { userId },
    create: {
      userId,
      status: "unverified", // Will be set to "pending" by API route when submitted
      businessName: data.businessName || null,
      abn: data.abn || null,
      primaryTrade: data.primaryTrade || null,
      workTypes: data.workTypes || null,
      licenceNumber: data.licenceNumber || null,
      licenceType: data.licenceType || null,
      licenceExpiry: licenceExpiry,
      insuranceProvider: data.insuranceProvider || null,
      insurancePolicyNumber: data.insurancePolicyNumber || null,
      insuranceExpiry: insuranceExpiry,
      insuranceCoverageNotes: data.insuranceCoverageNotes || null,
      abnEvidenceUrl: data.abnEvidenceUrl || null,
      licenceEvidenceUrl: data.licenceEvidenceUrl || null,
      insuranceEvidenceUrl: data.insuranceEvidenceUrl || null,
    },
    update: {
      businessName: data.businessName || null,
      abn: data.abn || null,
      primaryTrade: data.primaryTrade || null,
      workTypes: data.workTypes || null,
      licenceNumber: data.licenceNumber || null,
      licenceType: data.licenceType || null,
      licenceExpiry: licenceExpiry,
      insuranceProvider: data.insuranceProvider || null,
      insurancePolicyNumber: data.insurancePolicyNumber || null,
      insuranceExpiry: insuranceExpiry,
      insuranceCoverageNotes: data.insuranceCoverageNotes || null,
      abnEvidenceUrl: data.abnEvidenceUrl || null,
      licenceEvidenceUrl: data.licenceEvidenceUrl || null,
      insuranceEvidenceUrl: data.insuranceEvidenceUrl || null,
      // Don't update status here - that's admin-only
      // Don't update adminNotes or rejectionReason here
    },
  });
}

/**
 * Admin-only: Updates verification status and admin notes
 * 
 * VERIFICATION PROCESS E2E (Requirement 9):
 * - Signup → pending verification → admin approve/reject → verified gating works
 * - Rejection blocks user, shows status, allows re-submission
 * - All review metadata is captured: reviewer ID, timestamp, notes
 */
export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  adminData?: {
    adminNotes?: string | null;
    rejectionReason?: string | null;
    reviewerId?: string | null;
  }
): Promise<UserVerification> {
  const now = new Date();
  const updateData: any = {
    status,
    updatedAt: now,
  };

  // Track review metadata whenever admin changes status
  if (adminData?.reviewerId) {
    updateData.reviewedByAdminId = adminData.reviewerId;
  }

  if (adminData) {
    if (adminData.adminNotes !== undefined) {
      updateData.adminNotes = adminData.adminNotes;
    }
    if (adminData.rejectionReason !== undefined) {
      updateData.rejectionReason = adminData.rejectionReason;
    }
  }

  // If status is verified, clear rejection reason
  if (status === "verified") {
    updateData.rejectionReason = null;
  }

  const prisma = getPrisma();
  // Also update the User's verificationStatus field for backwards compatibility
  // This ensures both UserVerification.status and User.verificationStatus are in sync
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationStatus: status,
      verifiedAt: status === "verified" ? now : null,
    },
  });

  return prisma.userVerification.update({
    where: { userId },
    data: updateData,
  });
}

/**
 * Gets all verification records with a specific status, sorted by createdAt desc
 */
export async function getVerificationsByStatus(
  status: VerificationStatus
): Promise<UserVerification[]> {
  const prisma = getPrisma();
  return prisma.userVerification.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Gets the count of pending verification records
 * Used by dashboard to show admin notification count
 */
export async function getPendingVerificationCount(): Promise<number> {
  try {
    const prisma = getPrisma();
    return await prisma.userVerification.count({
      where: { status: "pending" },
    });
  } catch (error) {
    console.error("[verification] error counting pending verifications:", error);
    return 0;
  }
}

/**
 * Gets all verification records, sorted by status (pending first) then createdAt desc
 */
export async function getAllVerifications(): Promise<UserVerification[]> {
  try {
    const prisma = getPrisma();
    const verifications = await prisma.userVerification.findMany({
      orderBy: [
        { status: "asc" }, // pending comes before verified/rejected
        { createdAt: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
    
    // Filter out any verifications with missing user relations (orphaned records)
    return verifications.filter(v => v.user !== null);
  } catch (error) {
    console.error("[verification] error fetching all verifications:", error);
    // Return empty array instead of throwing - allows admin page to load gracefully
    return [];
  }
}

