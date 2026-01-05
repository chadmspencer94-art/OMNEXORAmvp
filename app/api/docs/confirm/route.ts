/**
 * Document Confirm API Route
 * 
 * POST /api/docs/confirm
 * Sets document status to CONFIRMED (user has reviewed and confirmed content)
 * 
 * Requires DOC_ENGINE_V1 feature flag.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";
import { featureFlags } from "@/lib/featureFlags";
import type { DocType } from "@/lib/docEngine/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/docs/confirm
 * Confirm document content (sets status to CONFIRMED)
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
    const { jobId, docType } = body;

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

    // Get existing draft
    const prisma = getPrisma();
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

    // Update to CONFIRMED status
    const draft = await prisma.documentDraft.update({
      where: {
        jobId_docType: {
          jobId,
          docType: docType as DocType,
        },
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        approved: true,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        jobId: draft.jobId,
        docType: draft.docType,
        status: draft.status,
        confirmedAt: draft.confirmedAt?.toISOString() ?? null,
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[docs/confirm] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to confirm document" },
      { status: 500 }
    );
  }
}

