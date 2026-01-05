"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, Download, Loader2, Lock } from "lucide-react";
import { PdfDocument } from "@/lib/pdfGenerator";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import type { SafeUser } from "@/lib/auth";
import type { Job } from "@/lib/jobs";

interface SpecDocExportButtonsProps {
  job: Job;
  user: SafeUser | null;
  planTier?: string;
  planStatus?: string;
}

export default function SpecDocExportButtons({ 
  job, 
  user, 
  planTier = "FREE",
  planStatus = "TRIAL",
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

      // Title
      pdf.addTitle("Detailed Scope of Work & Specifications");
      pdf.addSeparator();

      // Job Details Metadata
      pdf.addMetadata([
        { label: "Project", value: job.title || "" },
        { label: "Property Address", value: job.address || "" },
        { label: "Trade Type", value: job.tradeType || "" },
        { label: "Property Type", value: job.propertyType || "" },
        { label: "Client", value: job.clientName || "" },
        { label: "Document Date", value: formatDate(job.updatedAt || job.createdAt) },
      ]);

      pdf.addSeparator();

      // Scope of Work
      pdf.addSectionHeading("Scope of Work");
      scopeLines.forEach((line, index) => {
        pdf.addParagraph(`${index + 1}. ${line}`, { indent: 4 });
      });

      pdf.addSpace(8);

      // Specifications
      if (job.aiInclusions || job.aiMaterials || job.notes) {
        pdf.addSectionHeading("Specifications");
        
        if (job.aiInclusions) {
          pdf.addSubheading("Included Items");
          const inclusions = job.aiInclusions.split("\n").filter(line => line.trim());
          pdf.addBulletList(inclusions);
          pdf.addSpace(4);
        }

        if (job.aiMaterials) {
          pdf.addSubheading("Materials");
          pdf.addParagraph(job.materialsOverrideText || job.aiMaterials);
          pdf.addSpace(4);
        }

        if (job.notes) {
          pdf.addSubheading("Additional Notes");
          pdf.addParagraph(job.notes);
          pdf.addSpace(4);
        }
      }

      // Exclusions
      if (job.aiExclusions) {
        pdf.addSectionHeading("Exclusions");
        const exclusions = job.aiExclusions.split("\n").filter(line => line.trim());
        pdf.addBulletList(exclusions);
        pdf.addSpace(8);
      }

      // Signature Section
      pdf.addSeparator();
      pdf.addSpace(8);
      pdf.addParagraph("Client Signature", { fontSize: 10, bold: true });
      pdf.addSpace(12);
      pdf.addParagraph(job.clientName || "Client Name", { fontSize: 9 });
      pdf.addParagraph("Date: ________________", { fontSize: 9 });
      
      pdf.addSpace(8);
      pdf.addParagraph("Contractor Signature", { fontSize: 10, bold: true });
      pdf.addSpace(12);
      pdf.addParagraph(user?.email?.split("@")[0] || "", { fontSize: 9 });
      pdf.addParagraph("Date: ________________", { fontSize: 9 });

      // Footer
      pdf.addStandardFooters({ jobId: job.id });

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

