/**
 * Document Draft API Routes
 * 
 * GET /api/docs/draft?jobId=...&docType=...
 * POST /api/docs/draft (upsert by jobId+docType)
 * 
 * Requires DOC_ENGINE_V1 feature flag.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { requireVerifiedUser, UserNotVerifiedError } from "@/lib/authChecks";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";
import { featureFlags } from "@/lib/featureFlags";
import type { DocType } from "@/lib/docEngine/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/docs/draft
 * Get draft for a job + document type
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const docType = searchParams.get("docType");

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

    // Get draft from database
    const prisma = getPrisma();
    const draft = await prisma.documentDraft.findUnique({
      where: {
        jobId_docType: {
          jobId,
          docType: docType as DocType,
        },
      },
    });

    if (!draft) {
      return NextResponse.json({
        success: true,
        draft: null,
      });
    }

    // Parse JSON data
    let dataJson;
    try {
      dataJson = typeof draft.dataJson === "string" 
        ? JSON.parse(draft.dataJson) 
        : draft.dataJson;
    } catch {
      dataJson = null;
    }

    // Parse issuer data if present
    let issuerData = null;
    if (draft.issuerDataJson) {
      try {
        issuerData = typeof draft.issuerDataJson === "string"
          ? JSON.parse(draft.issuerDataJson)
          : draft.issuerDataJson;
      } catch {
        issuerData = null;
      }
    }

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        jobId: draft.jobId,
        docType: draft.docType,
        data: dataJson,
        approved: draft.approved ?? false,
        approvedAt: draft.approvedAt?.toISOString() ?? null,
        // Lifecycle status fields
        status: draft.status ?? "DRAFT",
        confirmedAt: draft.confirmedAt?.toISOString() ?? null,
        issuedAt: draft.issuedAt?.toISOString() ?? null,
        issuedRecordId: draft.issuedRecordId ?? null,
        issuer: issuerData,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[docs/draft] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch draft" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/docs/draft
 * Create or update draft for a job + document type
 * 
 * VERIFICATION GATE: Requires business verification before creating document drafts.
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

    // VERIFICATION GATE: Require business verification before document generation
    try {
      await requireVerifiedUser(user);
    } catch (error) {
      if (error instanceof UserNotVerifiedError) {
        return NextResponse.json(
          { error: error.message, code: "VERIFICATION_REQUIRED" },
          { status: 403 }
        );
      }
      throw error;
    }

    const body = await request.json();
    const { jobId, docType, data, approved } = body;

    if (!jobId || !docType || !data) {
      return NextResponse.json(
        { error: "jobId, docType, and data are required" },
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

    // Upsert draft
    const prisma = getPrisma();
    const dataJsonString = typeof data === "string" ? data : JSON.stringify(data);

    const draft = await prisma.documentDraft.upsert({
      where: {
        jobId_docType: {
          jobId,
          docType: docType as DocType,
        },
      },
      create: {
        jobId,
        docType: docType as DocType,
        dataJson: dataJsonString,
        approved: approved === true,
        approvedAt: approved === true ? new Date() : null,
      },
      update: {
        dataJson: dataJsonString,
        approved: approved === true ? true : undefined, // Only update if explicitly set to true
        approvedAt: approved === true ? new Date() : undefined, // Only update if explicitly set to true
      },
    });

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        jobId: draft.jobId,
        docType: draft.docType,
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[docs/draft] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}

