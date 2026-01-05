import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import { PdfDocument } from "@/lib/pdfGenerator";

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
 * POST /api/jobs/[id]/documents/[type]/pdf
 * Generate PDF for a document
 */
export async function POST(
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

    // Get plan info for access control
    let planTier = "FREE";
    let planStatus = "TRIAL";
    try {
      const { getPrisma } = await import("@/lib/prisma");
      const prisma = getPrisma();
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { planTier: true, planStatus: true },
      });
      if (prismaUser?.planTier) {
        planTier = prismaUser.planTier;
      }
      if (prismaUser?.planStatus) {
        planStatus = prismaUser.planStatus;
      }
    } catch (error) {
      console.warn("Failed to fetch plan info:", error);
    }

    // Check document feature access
    if (!hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: isAdmin(user) })) {
      return NextResponse.json(
        { error: "A paid plan or pilot program membership is required to download PDFs. Free users can create job packs only." },
        { status: 403 }
      );
    }

    // Get document content from request body or job
    const body = await request.json().catch(() => ({}));
    const content = body.content || (job as any)[DOCUMENT_FIELDS[docType].textField];

    if (!content) {
      return NextResponse.json(
        { error: "Document content not found" },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdf = new PdfDocument();
    const docLabel = docType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    // Header
    pdf.addTitle(docLabel);
    pdf.addSeparator();

    // Metadata
    pdf.addMetadata([
      { label: "Job", value: job.title || "" },
      { label: "Trade", value: job.tradeType || "" },
      { label: "Location", value: job.address || "" },
      { label: "Date", value: new Date().toLocaleDateString("en-AU") },
    ]);

    // AI Warning
    pdf.addAiWarning();

    // Document content
    const sections = content.split("\n\n");
    for (const section of sections) {
      if (section.trim()) {
        // Check if it's a heading (starts with # or all caps)
        if (section.match(/^#+\s/) || (section.length < 100 && section === section.toUpperCase() && !section.includes("."))) {
          pdf.addSectionHeading(section.replace(/^#+\s/, "").trim());
        } else {
          pdf.addParagraph(section.trim());
        }
      }
    }

    // Footer
    pdf.addStandardFooters();

    // Return PDF
    const blob = pdf.getBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${docType.toLowerCase()}-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

