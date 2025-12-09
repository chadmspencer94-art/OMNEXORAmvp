"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

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
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;

      // Helper to add text with wrapping
      const addWrappedText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        
        const lines = doc.splitTextToSize(text, maxWidth);
        
        if (y + lines.length * (fontSize * 0.4) > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        
        lines.forEach((line: string) => {
          doc.text(line, margin, y);
          y += fontSize * 0.4;
        });
      };

      // Helper to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(document.title, margin, y);
      y += 10;

      // Job details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      addWrappedText(`Job: ${jobTitle}`, 10);
      addWrappedText(`Trade: ${tradeType}`, 10);
      if (address) {
        addWrappedText(`Location: ${address}`, 10);
      }
      if (businessName) {
        addWrappedText(`Business: ${businessName}`, 10);
      }
      addWrappedText(`Date: ${new Date().toLocaleDateString("en-AU")}`, 10);
      y += 5;

      // Divider
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // =========================================
      // AI GENERATED CONTENT WARNING
      // =========================================
      checkNewPage(30);
      doc.setFillColor(254, 243, 199); // amber-50
      doc.rect(margin, y - 2, maxWidth, 28, "F");
      doc.setDrawColor(251, 191, 36); // amber-400 border
      doc.setLineWidth(0.5);
      doc.rect(margin, y - 2, maxWidth, 28);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(146, 64, 14); // amber-900
      doc.text("⚠️ AI-GENERATED CONTENT WARNING", margin + 4, y + 4);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 53, 15); // amber-800
      const warningText = "This document contains AI-generated content that must be reviewed and verified by you before use. You are responsible for ensuring compliance with all applicable Australian laws and regulations, including building codes, safety standards, workplace health and safety requirements, and consumer protection laws.";
      const warningLines = doc.splitTextToSize(warningText, maxWidth - 8);
      let warningY = y + 10;
      for (const line of warningLines) {
        doc.text(line, margin + 4, warningY);
        warningY += 4;
      }
      y = warningY + 8;

      // Content
      // Parse content into sections (simple approach: split by double newlines or headings)
      const sections = document.content.split(/\n\s*\n/).filter(s => s.trim());
      
      sections.forEach((section) => {
        checkNewPage(15);
        
        // Check if this looks like a heading (starts with # or is short and bold-looking)
        const trimmed = section.trim();
        const isHeading = trimmed.startsWith("#") || 
                         (trimmed.length < 100 && trimmed.split("\n").length === 1);
        
        if (isHeading) {
          // Heading
          const headingText = trimmed.replace(/^#+\s*/, "");
          addWrappedText(headingText, 12, true);
          y += 3;
        } else {
          // Regular content
          // Split by lines and process
          const lines = section.split("\n");
          lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
              y += 5;
              return;
            }
            
            // Check for bullet points or numbered lists
            if (trimmedLine.match(/^[-•*]\s/) || trimmedLine.match(/^\d+\.\s/)) {
              addWrappedText(trimmedLine, 10);
            } else {
              addWrappedText(trimmedLine, 10);
            }
          });
          y += 5;
        }
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 30,
          pageHeight - 10
        );
      }

      // Save PDF
      const fileName = `${document.type.toLowerCase()}_${jobTitle.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
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

