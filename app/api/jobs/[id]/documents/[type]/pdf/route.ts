import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import { PdfDocument, PDF_CONFIG } from "@/lib/pdfGenerator";

type DocumentType = "SWMS" | "VARIATION" | "EOT" | "PROGRESS_CLAIM" | "HANDOVER" | "MAINTENANCE";

const DOCUMENT_FIELDS: Record<DocumentType, { textField: keyof any; confirmedField: keyof any }> = {
  SWMS: { textField: "swmsText", confirmedField: "swmsConfirmed" },
  VARIATION: { textField: "variationText", confirmedField: "variationConfirmed" },
  EOT: { textField: "eotText", confirmedField: "eotConfirmed" },
  PROGRESS_CLAIM: { textField: "progressClaimText", confirmedField: "progressClaimConfirmed" },
  HANDOVER: { textField: "handoverText", confirmedField: "handoverConfirmed" },
  MAINTENANCE: { textField: "maintenanceText", confirmedField: "maintenanceConfirmed" },
};

// Document type labels for display
const DOCUMENT_LABELS: Record<DocumentType, string> = {
  SWMS: "Safe Work Method Statement",
  VARIATION: "Variation Notice",
  EOT: "Extension of Time",
  PROGRESS_CLAIM: "Progress Claim",
  HANDOVER: "Handover & Practical Completion",
  MAINTENANCE: "Maintenance Schedule",
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

    // Generate PDF with proper multi-page layout for documents with full content
    const pdf = new PdfDocument();
    const docLabel = DOCUMENT_LABELS[docType] || docType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const documentNumber = `${docType}-${id.slice(0, 8).toUpperCase()}`;
    const documentDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // =========================================
    // PREMIUM HEADER
    // =========================================
    pdf.addCompactPremiumHeader({
      documentType: docLabel,
      documentRef: documentNumber,
      documentDate,
      issuer: businessProfile ? {
        businessName: businessProfile.legalName,
        abn: businessProfile.abn,
        phone: businessProfile.phone,
        email: businessProfile.email,
      } : undefined,
      client: job.clientName ? {
        name: job.clientName,
        address: job.address || undefined,
      } : undefined,
      projectTitle: job.title || undefined,
      projectAddress: job.address || undefined,
    });

    // =========================================
    // DOCUMENT CONTENT - Full content with proper formatting
    // =========================================
    // Parse content by lines, handling markdown formatting
    const lines = content.split("\n");
    let currentList: string[] = [];
    let inChecklist = false;

    const flushList = () => {
      if (currentList.length > 0) {
        pdf.addBulletList(currentList);
        currentList = [];
      }
      inChecklist = false;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      
      // Skip empty lines
      if (!line) {
        flushList();
        pdf.addSpace(2);
        continue;
      }

      // Handle markdown headings: ## Heading or **Heading**
      const markdownHeadingMatch = line.match(/^#{1,6}\s+(.+)$/);
      const boldHeadingMatch = line.match(/^\*\*(.+)\*\*$/);
      const numberedHeadingMatch = line.match(/^\d+\.\s+\*\*(.+)\*\*$/);
      
      if (markdownHeadingMatch || boldHeadingMatch || numberedHeadingMatch) {
        flushList();
        const headingText = (markdownHeadingMatch?.[1] || boldHeadingMatch?.[1] || numberedHeadingMatch?.[1] || "").trim();
        pdf.addSectionHeading(headingText);
        continue;
      }

      // Handle sub-headings with - prefix like "- Title"
      const subHeadingMatch = line.match(/^[-•]\s+\*\*(.+)\*\*/);
      if (subHeadingMatch) {
        flushList();
        pdf.addSubheading(subHeadingMatch[1].trim());
        continue;
      }

      // Handle checkboxes: ☐ Item or [ ] Item
      const checkboxMatch = line.match(/^[☐☑✓✔\[\]]\s*(.+)$/);
      if (checkboxMatch) {
        inChecklist = true;
        currentList.push(`☐ ${checkboxMatch[1].replace(/\*\*/g, "").trim()}`);
        continue;
      }

      // Handle bullet points: - Item or • Item or * Item
      const bulletMatch = line.match(/^[-•*]\s+(.+)$/);
      if (bulletMatch && !inChecklist) {
        currentList.push(bulletMatch[1].replace(/\*\*/g, "").trim());
        continue;
      }

      // Handle numbered list items: 1. Item
      const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch && !line.includes("**")) {
        currentList.push(numberedMatch[1].replace(/\*\*/g, "").trim());
        continue;
      }

      // Regular text - flush any pending list first
      flushList();
      
      // Clean markdown from text (remove ** for bold, etc.)
      const cleanedLine = line.replace(/\*\*/g, "").replace(/\*/g, "").trim();
      if (cleanedLine) {
        pdf.addParagraph(cleanedLine);
      }
    }
    
    // Flush any remaining list items
    flushList();

    // =========================================
    // TOTALS BOX FOR PROGRESS CLAIM / INVOICE TYPES
    // =========================================
    if (docType === "PROGRESS_CLAIM") {
      const totalMatch = content.match(/total[:\s]*\$?([\d,]+\.?\d*)/i);
      const gstMatch = content.match(/gst[:\s]*\$?([\d,]+\.?\d*)/i);
      const subtotalMatch = content.match(/subtotal[:\s]*\$?([\d,]+\.?\d*)/i);
      
      const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, "")) : 0;
      const gst = gstMatch ? parseFloat(gstMatch[1].replace(/,/g, "")) : (total ? total * 0.091 : 0);
      const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, "")) : (total ? total * 0.909 : 0);
      
      if (total > 0) {
        pdf.addCompactTotalsBox({
          subtotal: Math.round(subtotal),
          gst: Math.round(gst),
          total: Math.round(total),
        });
      }
    }

    // =========================================
    // SIGNATURE BLOCK (Trade + Client)
    // =========================================
    pdf.addSpace(6);
    pdf.addSeparator();
    pdf.addSectionHeading("Acceptance & Signatures");
    pdf.addSpace(4);
    
    // Two-column signature layout
    pdf.addCompactDualSignatureBlock({
      tradeLabel: "CONTRACTOR/TRADE",
      tradeName: businessProfile?.legalName || "",
      clientLabel: "CLIENT/PRINCIPAL",
      clientName: job.clientName || "",
    });

    // =========================================
    // STANDARD FOOTER WITH PAGE NUMBERS
    // =========================================
    pdf.addStandardFooters({ jobId: id });

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

