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
 * Generate PDF for a document (client-facing export)
 * 
 * Export Gates:
 * - Requires paid plan (hasDocumentFeatureAccess)
 * - R3,R6: Requires document confirmation before export
 * - AI warnings only shown for unconfirmed internal previews
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

    // Get plan info and business profile for access control and PDF header
    let planTier = "FREE";
    let planStatus = "TRIAL";
    let businessProfile: {
      legalName?: string;
      tradingName?: string;
      abn?: string;
      email?: string;
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
    } | null = null;
    
    try {
      const { getPrisma } = await import("@/lib/prisma");
      const prisma = getPrisma();
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { 
          planTier: true, 
          planStatus: true,
          businessName: true,
          tradingName: true,
          abn: true,
          email: true,
          businessPhone: true,
          businessAddressLine1: true,
          businessAddressLine2: true,
          businessSuburb: true,
          businessState: true,
          businessPostcode: true,
        },
      });
      if (prismaUser?.planTier) {
        planTier = prismaUser.planTier;
      }
      if (prismaUser?.planStatus) {
        planStatus = prismaUser.planStatus;
      }
      if (prismaUser?.businessName) {
        businessProfile = {
          legalName: prismaUser.businessName || undefined,
          tradingName: prismaUser.tradingName || undefined,
          abn: prismaUser.abn || undefined,
          email: prismaUser.email || undefined,
          phone: prismaUser.businessPhone || undefined,
          addressLine1: prismaUser.businessAddressLine1 || undefined,
          addressLine2: prismaUser.businessAddressLine2 || undefined,
          suburb: prismaUser.businessSuburb || undefined,
          state: prismaUser.businessState || undefined,
          postcode: prismaUser.businessPostcode || undefined,
        };
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

    // R3,R6: Check document confirmation status before allowing export
    // PDF downloads are client-facing exports and require confirmation
    const isConfirmed = (job as any)[DOCUMENT_FIELDS[docType].confirmedField] === true;
    if (!isConfirmed) {
      return NextResponse.json(
        {
          error: "Document must be confirmed before downloading PDF. Please review and confirm the AI-generated content first.",
          code: "CONFIRMATION_REQUIRED",
          hint: "Confirm the document to remove AI warnings and enable PDF export.",
        },
        { status: 400 }
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

    // Business Header
    if (businessProfile?.legalName) {
      pdf.addBusinessHeader(businessProfile);
    }

    // Document Title
    pdf.addTitle(docLabel);
    pdf.addSeparator();

    // Metadata
    pdf.addMetadata([
      { label: "Job", value: job.title || "" },
      { label: "Trade", value: job.tradeType || "" },
      { label: "Location", value: job.address || "" },
      { label: "Date", value: new Date().toLocaleDateString("en-AU") },
    ]);

    // R3: No AI warnings on confirmed document exports (client-facing)
    // AI warnings are only shown in draft/preview mode, not in exported PDFs

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
    if (businessProfile?.legalName) {
      pdf.addIssuedFooter(businessProfile.legalName, `${docType}-${id.slice(0, 8).toUpperCase()}`);
    } else {
      pdf.addStandardFooters();
    }

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

