/**
 * Server-Side Job Pack PDF Generation
 * 
 * POST /api/jobs/[id]/pack-pdf
 * 
 * Generates a PDF for a Job Pack with proper server-side export gates:
 * - R1: Export vs Draft separation - exports require confirmation
 * - R4: Totals reconciliation gate - materials total must match line totals
 * - R10: Paid plan export lock - server-side enforced
 * 
 * This endpoint replaces client-side PDF generation to ensure
 * all export gates are server-enforced and cannot be bypassed.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import { validateMaterialsTotalsForExport } from "@/lib/materials";
import { PdfDocument, formatCurrency, formatDate, formatDateTime } from "@/lib/pdfGenerator";
import { calculateEstimateRange } from "@/lib/pricing";
import { getPrisma } from "@/lib/prisma";

// Types for parsed quote data
interface LabourQuote {
  description?: string;
  hours?: string;
  ratePerHour?: string;
  total?: string;
}

interface MaterialsQuote {
  description?: string;
  totalMaterialsCost?: string;
}

interface TotalEstimateQuote {
  description?: string;
  totalJobEstimate?: string;
}

interface ParsedQuote {
  labour?: LabourQuote;
  materials?: MaterialsQuote;
  totalEstimate?: TotalEstimateQuote;
}

interface MaterialItem {
  item: string;
  quantity?: string;
  estimatedCost?: string;
}

interface JobMaterial {
  name: string;
  unitLabel: string;
  quantity: number;
  lineTotal: number | null;
}

/**
 * POST /api/jobs/[id]/pack-pdf
 * Generate Job Pack PDF with server-side export gates
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id: jobId } = await context.params;

    // Load job
    const job = await getJobById(jobId);
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

    // Get plan info and business profile
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

    const prisma = getPrisma();

    try {
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
      console.warn("[pack-pdf] Failed to fetch user profile:", error);
    }

    // R10: Server-side paid plan export gate
    if (!hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: isAdmin(user) })) {
      return NextResponse.json(
        {
          error: "A paid plan or pilot program membership is required to download PDFs. Free users can create job packs only.",
          code: "PAID_PLAN_REQUIRED",
          redirectTo: "/pricing",
        },
        { status: 403 }
      );
    }

    // R1: Check AI pack confirmation status for exports
    // PDF downloads are client-facing exports and require confirmation
    const isConfirmed = job.aiReviewStatus === "confirmed";
    if (!isConfirmed) {
      return NextResponse.json(
        {
          error: "Job pack must be confirmed before downloading PDF. Please review the AI-generated content and click 'Mark AI pack as confirmed'.",
          code: "CONFIRMATION_REQUIRED",
          hint: "Confirm the AI pack to remove AI warnings and enable PDF export.",
        },
        { status: 400 }
      );
    }

    // Fetch job materials
    let jobMaterials: JobMaterial[] = [];
    try {
      const materials = await (prisma as any).jobMaterial.findMany({
        where: {
          jobId,
          userId: user.id,
        },
        orderBy: { createdAt: "asc" },
      });
      jobMaterials = materials.map((m: any) => ({
        name: m.name,
        unitLabel: m.unitLabel,
        quantity: m.quantity,
        lineTotal: m.lineTotal ? Number(m.lineTotal) : null,
      }));
    } catch (err) {
      console.warn("[pack-pdf] Failed to fetch job materials:", err);
    }

    // R4: Totals reconciliation gate - ensure materials total matches line totals
    // Only applies if there are job materials with line totals
    if (jobMaterials.length > 0) {
      const reconciliation = await validateMaterialsTotalsForExport(
        jobId,
        user.id,
        job.materialsTotal ?? null
      );

      if (!reconciliation.isValid) {
        return NextResponse.json(
          {
            error: reconciliation.message || "Materials totals do not reconcile. Please recalculate materials before exporting.",
            code: "TOTALS_MISMATCH",
            details: {
              sumOfLineTotals: reconciliation.sumOfLineTotals,
              storedMaterialsTotal: reconciliation.storedMaterialsTotal,
              difference: reconciliation.difference,
            },
            hint: "Open the Materials Management section and click 'Recalculate' to fix the totals.",
          },
          { status: 400 }
        );
      }
    }

    // Fetch client signature if exists
    let clientSignature: {
      signedName: string;
      signedEmail: string;
      signedAt: string;
      signatureImage: string | null;
    } | null = null;

    if (job.clientSignatureId && job.clientSignedName && job.clientAcceptedAt) {
      try {
        const signature = await prisma.signature.findUnique({
          where: { id: job.clientSignatureId },
          select: { imageDataUrl: true },
        });
        clientSignature = {
          signedName: job.clientSignedName,
          signedEmail: job.clientSignedEmail || "",
          signedAt: job.clientAcceptedAt,
          signatureImage: signature?.imageDataUrl || null,
        };
      } catch (err) {
        console.warn("[pack-pdf] Failed to fetch signature:", err);
        clientSignature = {
          signedName: job.clientSignedName,
          signedEmail: job.clientSignedEmail || "",
          signedAt: job.clientAcceptedAt,
          signatureImage: null,
        };
      }
    }

    // Generate PDF
    const pdf = new PdfDocument();

    // =========================================
    // BUSINESS HEADER
    // =========================================
    if (businessProfile?.legalName) {
      pdf.addBusinessHeader(businessProfile);
    } else {
      pdf.addBrandedHeader("Job Pack");
    }

    // =========================================
    // JOB TITLE
    // =========================================
    pdf.addTitle(job.title || "Job Pack");
    pdf.addText("Job Pack / Quote", { fontSize: 10, color: [100, 116, 139] });
    pdf.addSpace(4);

    // =========================================
    // JOB METADATA
    // =========================================
    const metaItems: Array<{ label: string; value: string }> = [];
    if (job.tradeType) metaItems.push({ label: "Trade", value: job.tradeType });
    if (job.propertyType) metaItems.push({ label: "Property", value: job.propertyType });
    if (job.address) metaItems.push({ label: "Address", value: job.address });
    if (job.clientName) metaItems.push({ label: "Client", value: job.clientName });
    metaItems.push({ label: "Date", value: formatDate(job.createdAt) });
    pdf.addMetadata(metaItems);

    // R1: No AI warnings on confirmed exports (already gated above)

    // =========================================
    // SUMMARY
    // =========================================
    if (job.aiSummary) {
      pdf.addSectionHeading("Summary");
      pdf.addParagraph(job.aiSummary);
    }

    // =========================================
    // PRICING
    // =========================================
    if (job.aiQuote) {
      try {
        const quote: ParsedQuote = JSON.parse(job.aiQuote);
        pdf.addSectionHeading("Pricing");

        if (quote.labour) {
          pdf.addSubheading("Labour");
          if (quote.labour.description) {
            pdf.addParagraph(quote.labour.description);
          }
          const labourDetails: string[] = [];
          if (quote.labour.hours) labourDetails.push(`Hours: ${quote.labour.hours}`);
          if (quote.labour.ratePerHour) labourDetails.push(`Rate: ${quote.labour.ratePerHour}`);
          if (quote.labour.total) labourDetails.push(`Total: ${quote.labour.total}`);
          if (labourDetails.length > 0) {
            pdf.addParagraph(labourDetails.join("  |  "));
          }
        }

        if (quote.materials) {
          pdf.addSubheading("Materials");
          if (quote.materials.description) {
            pdf.addParagraph(quote.materials.description);
          }
          if (quote.materials.totalMaterialsCost) {
            pdf.addParagraph(`Total: ${quote.materials.totalMaterialsCost}`);
          }
        }

        if (quote.totalEstimate) {
          const estimateRange = calculateEstimateRange(job.aiQuote);
          pdf.addHighlightBox({
            label: "Total Estimate",
            value: estimateRange.formattedRange,
          });
        }
      } catch {
        // Skip pricing if JSON parsing fails
      }
    }

    // =========================================
    // SCOPE OF WORK
    // =========================================
    if (job.aiScopeOfWork) {
      pdf.addSectionHeading("Scope of Work");
      const scopeItems = job.aiScopeOfWork.split("\n").filter((line) => line.trim());
      pdf.addNumberedList(scopeItems);
    }

    // =========================================
    // INCLUSIONS
    // =========================================
    if (job.aiInclusions) {
      pdf.addSectionHeading("What's Included");
      const inclusionItems = job.aiInclusions.split("\n").filter((line) => line.trim());
      pdf.addInclusionsList(inclusionItems);
    }

    // =========================================
    // EXCLUSIONS
    // =========================================
    if (job.aiExclusions) {
      pdf.addSectionHeading("Not Included");
      const exclusionItems = job.aiExclusions.split("\n").filter((line) => line.trim());
      pdf.addExclusionsList(exclusionItems);
    }

    // =========================================
    // MATERIALS
    // =========================================
    const hasOverride = job.materialsOverrideText && job.materialsOverrideText.trim().length > 0;
    const hasJobMaterials = jobMaterials && jobMaterials.length > 0;

    if (hasJobMaterials) {
      pdf.addSectionHeading("Materials");

      // Build table data
      const headers = ["Material", "Qty", "Unit", "Total"];
      const rows = jobMaterials.map((m) => [
        m.name,
        m.quantity.toString(),
        m.unitLabel,
        formatCurrency(m.lineTotal || 0),
      ]);

      pdf.addTable(headers, rows, { colWidths: [80, 25, 30, 35] });

      // Total row
      const materialsTableTotal = jobMaterials.reduce((sum, m) => sum + (m.lineTotal || 0), 0);
      const finalTotal = job.materialsTotal != null ? job.materialsTotal : materialsTableTotal;
      pdf.addHighlightBox({
        label: "Materials Total",
        value: formatCurrency(finalTotal),
      });
    } else if (hasOverride) {
      pdf.addSectionHeading("Materials");
      pdf.addText("Final materials notes (overrides AI suggestion)", {
        fontSize: 9,
        fontWeight: "normal",
        color: [59, 130, 246],
      });
      pdf.addSpace(4);
      pdf.addParagraph(job.materialsOverrideText!);
    } else if (job.aiMaterials) {
      try {
        const materials: MaterialItem[] = JSON.parse(job.aiMaterials);
        if (Array.isArray(materials) && materials.length > 0) {
          pdf.addSectionHeading("Materials");

          const headers = ["Item", "Qty", "Est. Cost"];
          const rows = materials.map((m) => [
            m.item || "",
            m.quantity || "-",
            m.estimatedCost || "-",
          ]);

          pdf.addTable(headers, rows, { colWidths: [90, 35, 45] });
        }
      } catch {
        // Skip if JSON parsing fails - R3 will handle this better
      }
    }

    // R1: No materials disclaimer on confirmed exports

    // =========================================
    // CLIENT NOTES
    // =========================================
    if (job.aiClientNotes) {
      pdf.addSectionHeading("Notes for Client");
      pdf.addParagraph(job.aiClientNotes);
    }

    // =========================================
    // JOB DETAILS
    // =========================================
    if (job.notes) {
      pdf.addSectionHeading("Job Details");
      pdf.addParagraph(job.notes);
    }

    // =========================================
    // CLIENT ACCEPTANCE
    // =========================================
    if (job.clientAcceptedAt && (job.clientAcceptedByName || job.clientSignedName)) {
      pdf.addSectionHeading("Client Acceptance");

      // Add signature image if available
      if (clientSignature?.signatureImage) {
        pdf.addImage(clientSignature.signatureImage, { width: 80, height: 30 });
      }

      const acceptedByName = job.clientAcceptedByName || job.clientSignedName || "Unknown";
      pdf.addParagraph(`Accepted by: ${acceptedByName}`);

      if (job.clientSignedEmail) {
        pdf.addParagraph(`Email: ${job.clientSignedEmail}`);
      }

      pdf.addParagraph(`Accepted on: ${formatDateTime(job.clientAcceptedAt)}`);

      if (job.quoteNumber && job.clientAcceptedQuoteVer) {
        pdf.addParagraph(`Quote: ${job.quoteNumber} v${job.clientAcceptedQuoteVer}`);
      }

      if (job.clientAcceptanceNote && job.clientAcceptanceNote.trim()) {
        pdf.addSubheading("Client note:");
        pdf.addParagraph(job.clientAcceptanceNote);
      }
    }

    // =========================================
    // FOOTER - Professional footer for confirmed exports
    // =========================================
    if (businessProfile?.legalName) {
      pdf.addIssuedFooter(businessProfile.legalName, `JP-${jobId.slice(0, 8).toUpperCase()}`);
    } else {
      pdf.addStandardFooters({ jobId });
    }

    // Return PDF as response
    const blob = pdf.getBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="job-pack-${jobId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[pack-pdf] Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
