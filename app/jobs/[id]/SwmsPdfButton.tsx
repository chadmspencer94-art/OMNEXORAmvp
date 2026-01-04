"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PdfDocument, parseStructuredContent, formatDate } from "@/lib/pdfGenerator";

interface SwmsPdfButtonProps {
  jobId: string;
  jobTitle: string;
  jobCreatedAt: string;
  tradeType: string;
  propertyType: string;
  address?: string;
  clientName?: string;
  swmsText: string;
}

export default function SwmsPdfButton({
  jobId,
  jobTitle,
  jobCreatedAt,
  tradeType,
  propertyType,
  address,
  clientName,
  swmsText,
}: SwmsPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = () => {
    setIsGenerating(true);

    try {
      const pdf = new PdfDocument();

      // =========================================
      // HEADER
      // =========================================
      pdf.addTitle("Safe Work Method Statement (SWMS)");
      pdf.addSeparator();

      // =========================================
      // JOB METADATA
      // =========================================
      pdf.addMetadata([
        { label: "Job", value: jobTitle },
        { label: "Trade", value: tradeType },
        { label: "Property Type", value: propertyType },
        { label: "Location", value: address || "" },
        { label: "Client", value: clientName || "" },
        { label: "Date", value: formatDate(jobCreatedAt) },
      ]);

      // =========================================
      // AI WARNING
      // =========================================
      pdf.addAiWarning();

      // =========================================
      // SWMS CONTENT
      // =========================================
      const sections = parseStructuredContent(swmsText);
      
      for (const section of sections) {
        switch (section.type) {
          case "heading":
            pdf.addSectionHeading(section.content);
            break;
          case "list":
            const items = section.content.split("\n").filter((s) => s.trim());
            pdf.addBulletList(items);
            break;
          case "text":
          default:
            pdf.addParagraph(section.content);
            break;
        }
      }

      // =========================================
      // FOOTER
      // =========================================
      pdf.addStandardFooters({ jobId });

      // Save the PDF
      const filename = `swms-${jobId.slice(0, 8)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating SWMS PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadPdf}
      disabled={isGenerating}
      className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      title="Download SWMS as PDF"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          <span>Download SWMS PDF</span>
        </>
      )}
    </button>
  );
}
