"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, Download, Loader2, Lock } from "lucide-react";
import { PdfDocument } from "@/lib/pdfGenerator";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import type { SafeUser } from "@/lib/auth";
import type { Job } from "@/lib/jobs";

interface BusinessProfile {
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
}

interface SpecDocExportButtonsProps {
  job: Job;
  user: SafeUser | null;
  planTier?: string;
  planStatus?: string;
  businessProfile?: BusinessProfile | null;
}

export default function SpecDocExportButtons({ 
  job, 
  user, 
  planTier = "FREE",
  planStatus = "TRIAL",
  businessProfile,
}: SpecDocExportButtonsProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const hasAccess = hasDocumentFeatureAccess(user, { 
    planTier, 
    planStatus, 
    isAdmin: user?.isAdmin ?? false 
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownloadPdf = async () => {
    if (!hasAccess) {
      alert("A paid plan or pilot program membership is required to download PDFs. Free users can create job packs only.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pdf = new PdfDocument();
      const scopeLines = job.aiScopeOfWork?.split("\n").filter(line => line.trim()) || [];
      const documentRef = `SD-${job.id.slice(0, 8).toUpperCase()}`;
      const documentDate = formatDate(job.updatedAt || job.createdAt);

      // =========================================
      // COMPACT PREMIUM HEADER
      // =========================================
      pdf.addCompactPremiumHeader({
        documentType: "Scope of Work & Specifications",
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
      // SCOPE OF WORK (Compact numbered list)
      // =========================================
      if (scopeLines.length > 0) {
        pdf.addCompactSectionHeading("Scope of Work");
        const maxItems = Math.min(scopeLines.length, 12);
        for (let i = 0; i < maxItems; i++) {
          pdf.addCompactText(`${i + 1}. ${scopeLines[i]}`, { indent: 0 });
        }
        if (scopeLines.length > maxItems) {
          pdf.addCompactText(`+ ${scopeLines.length - maxItems} more items (see full specification)`, { 
            color: [100, 116, 139] 
          });
        }
        pdf.addSpace(3);
      }

      // =========================================
      // SPECIFICATIONS (Compact two-column layout)
      // =========================================
      const hasInclusions = job.aiInclusions && job.aiInclusions.trim();
      const hasMaterials = job.aiMaterials && job.aiMaterials.trim();
      const hasNotes = job.notes && job.notes.trim();
      
      if (hasInclusions || hasMaterials || hasNotes) {
        pdf.addCompactSectionHeading("Specifications");
        
        if (hasInclusions) {
          const doc = pdf.getDoc();
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(22, 163, 74);
          doc.text("Included Items:", 20, pdf.getY());
          pdf.addSpace(3);
          
          const inclusions = job.aiInclusions!.split("\n").filter(line => line.trim()).slice(0, 6);
          pdf.addCompactBulletList(inclusions, 6);
        }

        if (hasMaterials) {
          pdf.addCompactText("Materials:", { bold: true });
          const materialsText = (job.materialsOverrideText || job.aiMaterials || "").substring(0, 150);
          pdf.addCompactText(materialsText + (materialsText.length >= 150 ? "..." : ""), { indent: 2 });
          pdf.addSpace(2);
        }

        if (hasNotes) {
          pdf.addCompactText("Additional Notes:", { bold: true });
          const notesText = job.notes!.substring(0, 100);
          pdf.addCompactText(notesText + (notesText.length >= 100 ? "..." : ""), { indent: 2 });
          pdf.addSpace(2);
        }
      }

      // =========================================
      // EXCLUSIONS (Compact)
      // =========================================
      if (job.aiExclusions) {
        pdf.addCompactSectionHeading("Exclusions");
        const exclusions = job.aiExclusions.split("\n").filter(line => line.trim()).slice(0, 5);
        const doc = pdf.getDoc();
        exclusions.forEach((item) => {
          doc.setFontSize(6);
          doc.setTextColor(220, 38, 38);
          doc.text("✗", 20, pdf.getY());
          doc.setTextColor(15, 23, 42);
          doc.text(item.substring(0, 70), 24, pdf.getY());
          pdf.addSpace(2.5);
        });
        pdf.addSpace(2);
      }

      // =========================================
      // SIGNATURE BLOCK (Trade + Client)
      // =========================================
      pdf.addSpace(4);
      pdf.addCompactDualSignatureBlock({
        tradeLabel: "CONTRACTOR/TRADE",
        tradeName: businessProfile?.legalName || user?.email?.split("@")[0] || "",
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

      // Save PDF
      const filename = `spec-doc-${job.id.slice(0, 8)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="mt-6 print:hidden flex flex-wrap items-center gap-3">
      {/* Print Button - Always available */}
      <button
        onClick={() => window.print()}
        className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </button>

      {/* PDF Download Button - Requires access */}
      {hasAccess ? (
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </button>
      ) : (
        <button
          disabled
          className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg cursor-not-allowed"
          title="A paid plan or pilot program membership is required to download PDFs. Free users can create job packs only."
        >
          <Lock className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      )}

      <Link
        href={`/jobs/${job.id}`}
        className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
      >
        Back to Job
      </Link>
    </div>
  );
}

