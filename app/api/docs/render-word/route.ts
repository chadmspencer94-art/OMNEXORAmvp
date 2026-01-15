/**
 * Word Document Render API
 * 
 * POST /api/docs/render-word
 * 
 * Generates a Word (.docx) document from a document draft.
 * Ensures consistent formatting with proper tables and fonts.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import { getPrisma } from "@/lib/prisma";
import { generateWordDocument, formatDate, type WordDocumentOptions, type WordSection } from "@/lib/wordGenerator";
import type { RenderModel } from "@/lib/docEngine/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, docType, recordId, renderModel: clientRenderModel } = body;

    if (!jobId || !docType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Load job to verify ownership
    const job = await getJobById(jobId);
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get plan info for access check
    const prisma = getPrisma();
    let planTier = "FREE";
    let planStatus = "TRIAL";
    let businessName: string | undefined;

    try {
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          planTier: true,
          planStatus: true,
          businessName: true,
        },
      });
      if (prismaUser?.planTier) planTier = prismaUser.planTier;
      if (prismaUser?.planStatus) planStatus = prismaUser.planStatus;
      if (prismaUser?.businessName) businessName = prismaUser.businessName;
    } catch (err) {
      console.warn("[render-word] Failed to fetch user profile:", err);
    }

    // Check paid plan access
    if (!hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: false })) {
      return NextResponse.json(
        { error: "A paid plan is required to export documents." },
        { status: 403 }
      );
    }

    // Load the document draft
    let renderModel: RenderModel | null = clientRenderModel || null;

    if (!renderModel) {
      const draft = await (prisma as any).documentDraft.findFirst({
        where: {
          jobId,
          docType,
          userId: user.id,
        },
        orderBy: { updatedAt: "desc" },
      });

      if (draft?.dataJson) {
        try {
          renderModel = JSON.parse(draft.dataJson);
        } catch {
          return NextResponse.json({ error: "Invalid document data" }, { status: 400 });
        }
      }
    }

    if (!renderModel) {
      return NextResponse.json({ error: "No document data found" }, { status: 404 });
    }

    // Convert RenderModel to Word document options
    const wordOptions = convertToWordOptions(renderModel, job, businessName, recordId);

    // Generate the Word document
    const blob = await generateWordDocument(wordOptions);

    // Return as downloadable file
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${docType.toLowerCase()}-${recordId || jobId.slice(0, 8)}.docx"`,
      },
    });
  } catch (error) {
    console.error("[render-word] Error generating Word document:", error);
    return NextResponse.json(
      { error: "Failed to generate Word document" },
      { status: 500 }
    );
  }
}

/**
 * Convert RenderModel to Word document options
 */
function convertToWordOptions(
  renderModel: RenderModel,
  job: any,
  businessName?: string,
  recordId?: string
): WordDocumentOptions {
  const sections: WordSection[] = [];

  // Process each section from the render model
  if (renderModel.sections) {
    for (const section of renderModel.sections) {
      const wordSection: WordSection = {};

      if (section.title) {
        wordSection.heading = section.title;
      }

      // Process fields into paragraphs
      if (section.fields) {
        const paragraphs: string[] = [];
        for (const field of section.fields) {
          if (field.value !== null && field.value !== undefined && field.value !== "") {
            paragraphs.push(`${field.label}: ${field.value}`);
          }
        }
        if (paragraphs.length > 0) {
          wordSection.paragraphs = paragraphs;
        }
      }

      // Process list items
      if (section.listItems && section.listItems.length > 0) {
        wordSection.bulletList = section.listItems;
      }

      // Process tables
      if (section.tableData) {
        wordSection.table = {
          headers: section.tableData.headers || [],
          rows: section.tableData.rows || [],
        };
      }

      if (wordSection.heading || wordSection.paragraphs || wordSection.bulletList || wordSection.table) {
        sections.push(wordSection);
      }
    }
  }

  // Build metadata
  const metadata: Array<{ label: string; value: string }> = [];
  if (job.tradeType) metadata.push({ label: "Trade", value: job.tradeType });
  if (job.clientName) metadata.push({ label: "Client", value: job.clientName });
  if (job.address) metadata.push({ label: "Address", value: job.address });
  if (job.createdAt) metadata.push({ label: "Date", value: formatDate(job.createdAt) });

  return {
    title: renderModel.title || job.title || "Document",
    subtitle: renderModel.docType?.replace(/_/g, " ") || undefined,
    metadata: metadata.length > 0 ? metadata : undefined,
    sections,
    footer: {
      businessName,
      documentId: recordId,
    },
  };
}
