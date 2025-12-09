import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

type DocumentType = "SWMS" | "VARIATION" | "EOT" | "PROGRESS_CLAIM" | "HANDOVER" | "MAINTENANCE";

const DOCUMENT_FIELDS: Record<DocumentType, { textField: keyof any; confirmedField: keyof any }> = {
  SWMS: { textField: "swmsText", confirmedField: "swmsConfirmed" },
  VARIATION: { textField: "variationText", confirmedField: "variationConfirmed" },
  EOT: { textField: "eotText", confirmedField: "eotConfirmed" },
  PROGRESS_CLAIM: { textField: "progressClaimText", confirmedField: "progressClaimConfirmed" },
  HANDOVER: { textField: "handoverText", confirmedField: "handoverConfirmed" },
  MAINTENANCE: { textField: "maintenanceText", confirmedField: "maintenanceConfirmed" },
};

/**
 * GET /api/jobs/[id]/documents/[type]
 * Get document content and confirmation status
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id, type } = await context.params;
    const docType = type.toUpperCase() as DocumentType;

    if (!DOCUMENT_FIELDS[docType]) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const fields = DOCUMENT_FIELDS[docType];
    const content = (job as any)[fields.textField] as string | null | undefined;
    const confirmed = (job as any)[fields.confirmedField] as boolean | null | undefined;

    return NextResponse.json({
      success: true,
      content: content || null,
      confirmed: confirmed || false,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]/documents/[type]
 * Update document content and confirmation status
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Block clients from editing documents
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot edit documents" },
        { status: 403 }
      );
    }

    const { id, type } = await context.params;
    const docType = type.toUpperCase() as DocumentType;

    if (!DOCUMENT_FIELDS[docType]) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, confirmed } = body;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    if (typeof confirmed !== "boolean") {
      return NextResponse.json(
        { error: "Confirmed must be a boolean" },
        { status: 400 }
      );
    }

    const fields = DOCUMENT_FIELDS[docType];
    
    // Update job fields
    (job as any)[fields.textField] = content.trim();
    (job as any)[fields.confirmedField] = confirmed;

    await saveJob(job);

    return NextResponse.json({
      success: true,
      content: content.trim(),
      confirmed,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

