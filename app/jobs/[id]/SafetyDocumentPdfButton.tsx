"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PdfDocument, parseStructuredContent, formatDate } from "@/lib/pdfGenerator";

interface SafetyDocumentPdfButtonProps {
  document: {
    id: string;
    title: string;
    content: string;
    type: string;
  };
  jobTitle: string;
  tradeType: string;
  address?: string;
  businessName?: string;
}

export default function SafetyDocumentPdfButton({
  document,
  jobTitle,
  tradeType,
  address,
  businessName,
}: SafetyDocumentPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);

    try {
      const pdf = new PdfDocument();

      // =========================================
      // HEADER
      // =========================================
      pdf.addTitle(document.title);
      pdf.addSeparator();

      // =========================================
      // JOB METADATA
      // =========================================
      pdf.addMetadata([
        { label: "Job", value: jobTitle },
        { label: "Trade", value: tradeType },
        { label: "Location", value: address || "" },
        { label: "Business", value: businessName || "" },
        { label: "Date", value: formatDate(new Date().toISOString()) },
      ]);

      // =========================================
      // AI WARNING
      // =========================================
      pdf.addAiWarning();

      // =========================================
      // DOCUMENT CONTENT
      // =========================================
      const sections = parseStructuredContent(document.content);
      
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
      pdf.addStandardFooters();

      // Save PDF
      const fileName = `${document.type.toLowerCase()}_${jobTitle.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadPdf}
      disabled={isGenerating}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-1" />
          PDF
        </>
      )}
    </button>
  );
}
