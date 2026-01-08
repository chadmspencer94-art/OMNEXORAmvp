/**
 * Document Issue API Route
 * 
 * POST /api/docs/issue
 * Issues document for client export. This:
 * - Validates issuer (business profile) has required fields
 * - Sets status to ISSUED
 * - Generates unique issued record ID
 * - Snapshots issuer data for audit trail
 * 
 * Requires DOC_ENGINE_V1 feature flag.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";
import { featureFlags } from "@/lib/featureFlags";
import type { DocType } from "@/lib/docEngine/types";
import { validateIssuerForDoc, extractIssuerFromUser } from "@/lib/docEngine/validateIssuer";

export const dynamic = "force-dynamic";

/**
 * Generate a unique issued record ID
 */
function generateIssuedRecordId(docType: string): string {
  const prefix = docType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * POST /api/docs/issue
 * Issue document for client export
 */
export async function POST(request: NextRequest) {
  if (!featureFlags.DOC_ENGINE_V1) {
    return NextResponse.json(
      { error: "Document engine V1 is not enabled" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, docType, strict = true } = body;

    if (!jobId || !docType) {
      return NextResponse.json(
        { error: "jobId and docType are required" },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const prisma = getPrisma();

    // Get existing draft
    const existingDraft = await prisma.documentDraft.findUnique({
      where: {
        jobId_docType: {
          jobId,
          docType: docType as DocType,
        },
      },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: "Document draft not found. Please create a draft first." },
        { status: 404 }
      );
    }

    // Load full user profile for issuer validation
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        email: true,
        businessName: true,
        tradingName: true,
        abn: true,
        businessAddressLine1: true,
        businessAddressLine2: true,
        businessSuburb: true,
        businessState: true,
        businessPostcode: true,
        businessPhone: true,
        businessLogoUrl: true,
        gstRegistered: true,
        serviceArea: true,
      },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Extract and validate issuer profile
    const issuer = extractIssuerFromUser(prismaUser);
    const validation = validateIssuerForDoc(docType as DocType, issuer, strict);

    if (!validation.canIssue) {
      return NextResponse.json(
        { 
          error: "Cannot issue document due to missing business details",
          validation: {
            missingRequired: validation.missingRequired,
            missingRecommended: validation.missingRecommended,
            warnings: validation.warnings,
          },
          redirectTo: "/settings/business-profile",
        },
        { status: 400 }
      );
    }

    // Generate unique issued record ID
    const issuedRecordId = generateIssuedRecordId(docType);

    // Update draft to ISSUED status with issuer snapshot
    const draft = await prisma.documentDraft.update({
      where: {
        jobId_docType: {
          jobId,
          docType: docType as DocType,
        },
      },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
        issuedRecordId,
        issuerDataJson: JSON.stringify(issuer),
        // Also mark as approved/confirmed if not already
        approved: true,
        approvedAt: existingDraft.approvedAt || new Date(),
        confirmedAt: existingDraft.confirmedAt || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        jobId: draft.jobId,
        docType: draft.docType,
        status: draft.status,
        issuedAt: draft.issuedAt?.toISOString() ?? null,
        issuedRecordId: draft.issuedRecordId,
        updatedAt: draft.updatedAt.toISOString(),
      },
      issuer,
      validation: {
        missingRecommended: validation.missingRecommended,
        warnings: validation.warnings,
      },
    });
  } catch (error: any) {
    console.error("[docs/issue] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to issue document" },
      { status: 500 }
    );
  }
}


