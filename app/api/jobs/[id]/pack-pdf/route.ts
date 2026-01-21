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

    // Generate PDF - Compact one-page premium layout
    const pdf = new PdfDocument();
    const documentRef = `JP-${jobId.slice(0, 8).toUpperCase()}`;
    const documentDate = formatDate(job.createdAt);

    // =========================================
    // COMPACT PREMIUM HEADER
    // =========================================
    pdf.addCompactPremiumHeader({
      documentType: "Job Pack / Quote",
      documentRef,
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
    // SUMMARY (Compact)
    // =========================================
    if (job.aiSummary) {
      pdf.addCompactSectionHeading("Summary");
      // Truncate to fit one page
      const summaryText = job.aiSummary.length > 200 
        ? job.aiSummary.substring(0, 200) + "..." 
        : job.aiSummary;
      pdf.addCompactText(summaryText);
      pdf.addSpace(2);
    }

    // =========================================
    // SCOPE OF WORK (Compact bullet list)
    // =========================================
    if (job.aiScopeOfWork) {
      pdf.addCompactSectionHeading("Scope of Work");
      const scopeItems = job.aiScopeOfWork.split("\n").filter((line) => line.trim());
      pdf.addCompactBulletList(scopeItems, 8); // Max 8 items
      pdf.addSpace(2);
    }

    // =========================================
    // PRICING/ESTIMATE (Compact totals)
    // =========================================
    if (job.aiQuote) {
      try {
        const estimateRange = calculateEstimateRange(job.aiQuote);
        const totalEstimate = estimateRange.highEstimate || estimateRange.baseTotal || 0;
        
        if (totalEstimate > 0) {
          pdf.addCompactSectionHeading("Pricing");
          
          // Labour info if available
          const quote: ParsedQuote = JSON.parse(job.aiQuote);
          if (quote.labour?.hours || quote.labour?.ratePerHour) {
            const labourLine = [
              quote.labour.hours ? `${quote.labour.hours} hrs` : "",
              quote.labour.ratePerHour ? `@ ${quote.labour.ratePerHour}/hr` : "",
            ].filter(Boolean).join(" ");
            if (labourLine) {
              pdf.addCompactText(`Labour: ${labourLine}`, { indent: 2 });
            }
          }
          
          // Materials total if we have it
          const materialsTotal = job.materialsTotal || 
            (jobMaterials.length > 0 ? jobMaterials.reduce((sum, m) => sum + (m.lineTotal || 0), 0) : 0);
          if (materialsTotal > 0) {
            pdf.addCompactText(`Materials: ${formatCurrency(materialsTotal)}`, { indent: 2 });
          }
          
          pdf.addSpace(2);
          pdf.addCompactTotalsBox({
            subtotal: Math.round(totalEstimate * 0.909), // ex GST
            gst: Math.round(totalEstimate * 0.091),
            total: totalEstimate,
          });
        }
      } catch {
        // Skip pricing if JSON parsing fails
      }
    }

    // =========================================
    // INCLUSIONS & EXCLUSIONS (Side by side, compact)
    // =========================================
    const hasInclusions = job.aiInclusions && job.aiInclusions.trim();
    const hasExclusions = job.aiExclusions && job.aiExclusions.trim();
    
    if (hasInclusions || hasExclusions) {
      const doc = pdf.getDoc();
      const startY = pdf.getY();
      const colWidth = (pdf.getDoc().internal.pageSize.width - 40 - 5) / 2;
      
      // Inclusions (left column)
      if (hasInclusions) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 163, 74);
        doc.text("INCLUDED", 20, startY);
        
        const inclusionItems = job.aiInclusions!.split("\n").filter((line) => line.trim()).slice(0, 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(15, 23, 42);
        inclusionItems.forEach((item, i) => {
          doc.setTextColor(22, 163, 74);
          doc.text("✓", 20, startY + 4 + (i * 3));
          doc.setTextColor(15, 23, 42);
          doc.text(item.substring(0, 45), 24, startY + 4 + (i * 3));
        });
      }
      
      // Exclusions (right column)
      if (hasExclusions) {
        const rightX = 20 + colWidth + 5;
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("NOT INCLUDED", rightX, startY);
        
        const exclusionItems = job.aiExclusions!.split("\n").filter((line) => line.trim()).slice(0, 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        exclusionItems.forEach((item, i) => {
          doc.setTextColor(220, 38, 38);
          doc.text("✗", rightX, startY + 4 + (i * 3));
          doc.setTextColor(15, 23, 42);
          doc.text(item.substring(0, 45), rightX + 4, startY + 4 + (i * 3));
        });
      }
      
      const maxItems = Math.max(
        hasInclusions ? job.aiInclusions!.split("\n").filter((line) => line.trim()).slice(0, 5).length : 0,
        hasExclusions ? job.aiExclusions!.split("\n").filter((line) => line.trim()).slice(0, 5).length : 0
      );
      pdf.setY(startY + 5 + (maxItems * 3) + 3);
    }

    // =========================================
    // MATERIALS TABLE (Compact, if we have detailed materials)
    // =========================================
    if (jobMaterials && jobMaterials.length > 0) {
      pdf.addCompactSectionHeading("Materials");
      const headers = ["Material", "Qty", "Unit", "Total"];
      const rows = jobMaterials.map((m) => [
        m.name,
        m.quantity.toString(),
        m.unitLabel,
        formatCurrency(m.lineTotal || 0),
      ]);
      pdf.addCompactTable(headers, rows, { 
        colWidths: [75, 20, 25, 30], 
        maxRows: 6 
      });
    }

    // =========================================
    // SIGNATURE BLOCK (Trade + Client)
    // =========================================
    pdf.addSpace(3);
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
      documentId: documentRef,
    });

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
