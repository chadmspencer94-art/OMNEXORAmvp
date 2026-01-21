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

    // Generate PDF
    const pdf = new PdfDocument();
    const docLabel = DOCUMENT_LABELS[docType] || docType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const documentNumber = `${docType}-${id.slice(0, 8).toUpperCase()}`;
    const documentDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Helper function to clean text properly - fixes garbled "&" character issue
    const cleanText = (text: string): string => {
      if (!text) return "";
      return text
        // Remove markdown formatting
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#{1,6}\s*/g, "")
        // Fix checkbox symbols
        .replace(/☐/g, "")
        .replace(/☑/g, "")
        .replace(/✓/g, "")
        .replace(/✔/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/\[x\]/gi, "")
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim();
    };

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
    // HANDOVER - Specialized consolidated one-page layout
    // =========================================
    if (docType === "HANDOVER") {
      // Extract key information from the AI-generated content
      const tradeType = job.tradeType || "Trade";
      const completionDate = documentDate;
      
      // Statement of Practical Completion
      pdf.addCompactSectionHeading("Statement of Practical Completion");
      pdf.addCompactText(
        `We hereby declare that the ${tradeType} works for the project titled "${job.title || "Project"}" ` +
        `at ${job.address || "the project site"} have been practically completed as of ${completionDate}, ` +
        `subject to any minor defects noted below.`
      );
      pdf.addSpace(3);

      // Completion Checklist - Extract and consolidate from content
      pdf.addCompactSectionHeading("Completion Checklist");
      
      // Standard handover checklist items based on trade type
      const checklistItems = [
        "All areas completed as per agreed scope of work",
        "Surfaces cleaned and prepared for handover",
        "All rubbish and materials removed from site",
        "Final inspection completed with client",
        "Touch-ups and corrections completed",
        "Keys/access devices returned (if applicable)",
        "Safety checks completed",
        "Work area left in safe condition",
      ];
      
      pdf.addCompactBulletList(checklistItems, 8);
      pdf.addSpace(2);

      // Defects/Comments Section
      pdf.addCompactSectionHeading("Client Comments / Defects Noted");
      pdf.addCompactText("_".repeat(70), { color: [148, 163, 184] });
      pdf.addSpace(2);
      pdf.addCompactText("_".repeat(70), { color: [148, 163, 184] });
      pdf.addSpace(3);

      // Practical Completion Date
      pdf.addCompactSectionHeading("Practical Completion Date");
      pdf.addCompactText(`Date: ${completionDate}`);
      pdf.addSpace(4);
    } 
    // =========================================
    // PROGRESS CLAIM - Specialized layout
    // =========================================
    else if (docType === "PROGRESS_CLAIM") {
      // Parse content and render with proper formatting
      const lines = content.split("\n").filter((l: string) => l.trim());
      
      for (const rawLine of lines) {
        const line = cleanText(rawLine);
        if (!line) continue;
        
        // Check if it's a heading
        if (rawLine.match(/^#{1,6}\s/) || rawLine.match(/^\*\*[^*]+\*\*$/)) {
          pdf.addCompactSectionHeading(line);
        } else if (rawLine.match(/^[-•]\s/)) {
          pdf.addCompactText(`• ${line}`);
        } else {
          pdf.addCompactText(line);
        }
        pdf.addSpace(1);
      }

      // Totals box
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
    // OTHER DOCUMENTS - Standard formatting
    // =========================================
    else {
      // Parse and render content with proper formatting
      const lines = content.split("\n");
      let currentList: string[] = [];

      const flushList = () => {
        if (currentList.length > 0) {
          for (const item of currentList) {
            pdf.addCompactText(`• ${item}`);
          }
          currentList = [];
          pdf.addSpace(2);
        }
      };

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          flushList();
          pdf.addSpace(1);
          continue;
        }

        const cleaned = cleanText(line);
        if (!cleaned) continue;

        // Heading detection
        if (rawLine.match(/^#{1,6}\s/) || rawLine.match(/^\*\*[^*]+\*\*$/) || rawLine.match(/^\d+\.\s+\*\*/)) {
          flushList();
          pdf.addCompactSectionHeading(cleaned);
        }
        // Bullet/checkbox items
        else if (rawLine.match(/^[-•*☐☑✓✔]\s/) || rawLine.match(/^\[\s*\]/)) {
          currentList.push(cleaned);
        }
        // Numbered items (not headings)
        else if (rawLine.match(/^\d+\.\s/) && !rawLine.includes("**")) {
          currentList.push(cleaned);
        }
        // Regular text
        else {
          flushList();
          pdf.addCompactText(cleaned);
          pdf.addSpace(1);
        }
      }
      flushList();
    }

    // =========================================
    // SIGNATURE BLOCK (Trade + Client)
    // =========================================
    pdf.addSpace(4);
    pdf.addCompactDualSignatureBlock({
      tradeLabel: "CONTRACTOR/TRADE",
      tradeName: businessProfile?.legalName || "",
      clientLabel: "CLIENT/PRINCIPAL",
      clientName: job.clientName || "",
    });

    // =========================================
    // COMPACT FOOTER
    // =========================================
    pdf.addCompactFooter({
      issuerName: businessProfile?.legalName || "OMNEXORA",
      documentId: documentNumber,
    });

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

