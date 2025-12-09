"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { calculateEstimateRange } from "@/lib/pricing";

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

interface JobPackPdfButtonProps {
  jobId: string;
  jobTitle: string;
  jobCreatedAt: string;
  tradeType: string;
  propertyType?: string;
  address?: string;
  clientName?: string;
  notes?: string;
  aiSummary?: string;
  aiQuote?: string;
  aiScopeOfWork?: string;
  aiInclusions?: string;
  aiExclusions?: string;
  aiMaterials?: string;
  aiClientNotes?: string;
  materialsOverrideText?: string | null;
  materialsAreRoughEstimate?: boolean;
  materialsTotal?: number | null;
  clientSignatureId?: string | null;
  clientSignedName?: string | null;
  clientSignedEmail?: string | null;
  clientAcceptedAt?: string | null;
  clientAcceptedByName?: string | null;
  clientAcceptanceNote?: string | null;
  clientAcceptedQuoteVer?: number | null;
  quoteNumber?: string | null;
}

export default function JobPackPdfButton({
  jobId,
  jobTitle,
  jobCreatedAt,
  tradeType,
  propertyType,
  address,
  clientName,
  notes,
  aiSummary,
  aiQuote,
  aiScopeOfWork,
  aiInclusions,
  aiExclusions,
  aiMaterials,
  aiClientNotes,
  materialsOverrideText,
  materialsAreRoughEstimate,
  materialsTotal,
  clientSignatureId,
  clientSignedName,
  clientSignedEmail,
  clientAcceptedAt,
  clientAcceptedByName,
  clientAcceptanceNote,
  clientAcceptedQuoteVer,
  quoteNumber,
}: JobPackPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);

    // Fetch job materials if they exist
    let jobMaterials: Array<{
      name: string;
      unitLabel: string;
      quantity: number;
      lineTotal: number | null;
    }> = [];
    try {
      const materialsRes = await fetch(`/api/jobs/${jobId}/materials`);
      if (materialsRes.ok) {
        const materialsData = await materialsRes.json();
        jobMaterials = (materialsData.materials || []).map((m: any) => ({
          name: m.name,
          unitLabel: m.unitLabel,
          quantity: m.quantity,
          lineTotal: m.lineTotal,
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch job materials for PDF:", err);
    }

    // Fetch client signature if exists (for job owners/trades)
    let clientSignature: {
      signedName: string;
      signedEmail: string;
      signedAt: string;
      signatureImage: string | null;
    } | null = null;

    if (clientSignatureId && clientSignedName && clientAcceptedAt) {
      try {
        const sigResponse = await fetch(`/api/jobs/${jobId}/signature/${clientSignatureId}`);
        if (sigResponse.ok) {
          const sigData = await sigResponse.json();
          if (sigData.success) {
            clientSignature = {
              signedName: clientSignedName,
              signedEmail: clientSignedEmail || "",
              signedAt: clientAcceptedAt,
              signatureImage: sigData.imageDataUrl || null,
            };
          }
        }
      } catch (sigError) {
        console.warn("Failed to load signature for PDF:", sigError);
        // Continue without signature image, but still show acceptance info
        if (clientSignedName && clientAcceptedAt) {
          clientSignature = {
            signedName: clientSignedName,
            signedEmail: clientSignedEmail || "",
            signedAt: clientAcceptedAt,
            signatureImage: null,
          };
        }
      }
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      // Helper to check and add new page if needed
      const checkNewPage = (requiredSpace: number = 20) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Helper to add wrapped text
      const addWrappedText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, maxWidth);
        for (const line of lines) {
          checkNewPage();
          doc.text(line, margin, y);
          y += fontSize * 0.4;
        }
        y += 4; // Extra spacing after paragraph
      };

      // Helper to add section heading
      const addSectionHeading = (title: string) => {
        checkNewPage(20);
        y += 4;
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(title.toUpperCase(), margin, y);
        y += 8;
        // Add a line under the heading
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, y - 3, pageWidth - margin, y - 3);
        doc.setTextColor(0, 0, 0);
      };

      // =========================================
      // HEADER
      // =========================================
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 0, pageWidth, 35, "F");

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("OMNEXORA", margin, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Job Pack", margin, 26);

      y = 50;
      doc.setTextColor(0, 0, 0);

      // =========================================
      // JOB TITLE
      // =========================================
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(jobTitle, maxWidth);
      for (const line of titleLines) {
        doc.text(line, margin, y);
        y += 8;
      }
      y += 4;

      // =========================================
      // JOB META
      // =========================================
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500

      const metaItems: string[] = [];
      if (tradeType) metaItems.push(`Trade: ${tradeType}`);
      if (propertyType) metaItems.push(`Property: ${propertyType}`);
      if (address) metaItems.push(`Address: ${address}`);
      if (clientName) metaItems.push(`Client: ${clientName}`);
      metaItems.push(`Created: ${formatDate(jobCreatedAt)}`);

      for (const item of metaItems) {
        doc.text(item, margin, y);
        y += 5;
      }
      y += 6;

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
      for (const line of warningLines) {
        doc.text(line, margin + 4, y + 10);
        y += 4;
      }
      y += 8;

      doc.setTextColor(0, 0, 0);

      // =========================================
      // SUMMARY
      // =========================================
      if (aiSummary) {
        addSectionHeading("Summary");
        addWrappedText(aiSummary, 11);
      }

      // =========================================
      // QUOTE / PRICING
      // =========================================
      if (aiQuote) {
        try {
          const quote: ParsedQuote = JSON.parse(aiQuote);
          addSectionHeading("Pricing");

          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");

          if (quote.labour) {
            checkNewPage(25);
            doc.setFont("helvetica", "bold");
            doc.text("Labour", margin, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            if (quote.labour.description) {
              addWrappedText(quote.labour.description, 10);
            }
            const labourDetails: string[] = [];
            if (quote.labour.hours) labourDetails.push(`Hours: ${quote.labour.hours}`);
            if (quote.labour.ratePerHour) labourDetails.push(`Rate: ${quote.labour.ratePerHour}`);
            if (quote.labour.total) labourDetails.push(`Total: ${quote.labour.total}`);
            if (labourDetails.length > 0) {
              doc.text(labourDetails.join("  |  "), margin, y);
              y += 8;
            }
          }

          if (quote.materials) {
            checkNewPage(15);
            doc.setFont("helvetica", "bold");
            doc.text("Materials", margin, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            if (quote.materials.description) {
              addWrappedText(quote.materials.description, 10);
            }
            if (quote.materials.totalMaterialsCost) {
              doc.text(`Total: ${quote.materials.totalMaterialsCost}`, margin, y);
              y += 8;
            }
          }

          if (quote.totalEstimate) {
            checkNewPage(15);
            doc.setFillColor(254, 243, 199); // amber-100
            doc.rect(margin, y - 2, maxWidth, 20, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Total Estimate", margin + 4, y + 6);
            // Use calculated range instead of original totalJobEstimate
            const estimateRange = calculateEstimateRange(aiQuote);
            doc.setFontSize(14);
            doc.text(estimateRange.formattedRange, margin + 4, y + 14);
            y += 26;
          }
        } catch {
          // If JSON parsing fails, skip pricing
        }
      }

      // =========================================
      // SCOPE OF WORK
      // =========================================
      if (aiScopeOfWork) {
        addSectionHeading("Scope of Work");
        const scopeItems = aiScopeOfWork.split("\n").filter((line) => line.trim());
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        for (let i = 0; i < scopeItems.length; i++) {
          checkNewPage();
          const numText = `${i + 1}.`;
          doc.setFont("helvetica", "bold");
          doc.text(numText, margin, y);
          doc.setFont("helvetica", "normal");
          const itemLines = doc.splitTextToSize(scopeItems[i], maxWidth - 12);
          for (let j = 0; j < itemLines.length; j++) {
            if (j > 0) checkNewPage();
            doc.text(itemLines[j], margin + 10, y);
            y += 5;
          }
          y += 2;
        }
        y += 4;
      }

      // =========================================
      // INCLUSIONS
      // =========================================
      if (aiInclusions) {
        addSectionHeading("What's Included");
        const inclusionItems = aiInclusions.split("\n").filter((line) => line.trim());
        doc.setFontSize(11);
        for (const item of inclusionItems) {
          checkNewPage();
          doc.setTextColor(22, 163, 74); // green-600
          doc.text("✓", margin, y);
          doc.setTextColor(0, 0, 0);
          const itemLines = doc.splitTextToSize(item, maxWidth - 10);
          for (let j = 0; j < itemLines.length; j++) {
            if (j > 0) checkNewPage();
            doc.text(itemLines[j], margin + 8, y);
            y += 5;
          }
          y += 1;
        }
        y += 4;
      }

      // =========================================
      // EXCLUSIONS
      // =========================================
      if (aiExclusions) {
        addSectionHeading("Not Included");
        const exclusionItems = aiExclusions.split("\n").filter((line) => line.trim());
        doc.setFontSize(11);
        for (const item of exclusionItems) {
          checkNewPage();
          doc.setTextColor(220, 38, 38); // red-600
          doc.text("✗", margin, y);
          doc.setTextColor(0, 0, 0);
          const itemLines = doc.splitTextToSize(item, maxWidth - 10);
          for (let j = 0; j < itemLines.length; j++) {
            if (j > 0) checkNewPage();
            doc.text(itemLines[j], margin + 8, y);
            y += 5;
          }
          y += 1;
        }
        y += 4;
      }

      // =========================================
      // MATERIALS
      // =========================================
      const hasOverride = materialsOverrideText && materialsOverrideText.trim().length > 0;
      const showMaterialsDisclaimer = materialsAreRoughEstimate || !hasOverride;
      const hasJobMaterials = jobMaterials && jobMaterials.length > 0;

      // Prefer JobMaterial line items if they exist, otherwise fall back to AI/override
      if (hasJobMaterials) {
        addSectionHeading("Materials");

        // Table header
        checkNewPage(20);
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, y - 2, maxWidth, 8, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Material", margin + 2, y + 3);
        doc.text("Qty", margin + 110, y + 3);
        doc.text("Unit", margin + 130, y + 3);
        doc.text("Total", margin + 160, y + 3);
        y += 10;

        // Table rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        let materialsTableTotal = 0;
        for (const material of jobMaterials) {
          checkNewPage(8);
          const itemLines = doc.splitTextToSize(material.name || "", 100);
          doc.text(itemLines[0] || "", margin + 2, y);
          doc.text(material.quantity.toString(), margin + 110, y);
          doc.text(material.unitLabel, margin + 130, y);
          const lineTotal = material.lineTotal || 0;
          materialsTableTotal += lineTotal;
          doc.text(`$${lineTotal.toFixed(2)}`, margin + 160, y);
          y += 6;
          // Handle multi-line item names
          for (let j = 1; j < itemLines.length; j++) {
            checkNewPage();
            doc.text(itemLines[j], margin + 2, y);
            y += 5;
          }
        }

        // Materials total row
        checkNewPage(10);
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, margin + maxWidth, y);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Materials Total:", margin + 2, y);
        const finalTotal = materialsTotal != null ? materialsTotal : materialsTableTotal;
        doc.text(`$${finalTotal.toFixed(2)}`, margin + 160, y);
        doc.setFont("helvetica", "normal");
        y += 8;
      } else if (hasOverride) {
        // Show override text instead of AI materials
        addSectionHeading("Materials");
        
        // Add "Final materials notes" label
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(59, 130, 246); // blue-500
        doc.text("Final materials notes (overrides AI suggestion)", margin, y);
        y += 6;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        
        addWrappedText(materialsOverrideText, 11);
      } else if (aiMaterials) {
        try {
          const materials: MaterialItem[] = JSON.parse(aiMaterials);
          if (Array.isArray(materials) && materials.length > 0) {
            addSectionHeading("Materials");

            // Table header
            checkNewPage(15);
            doc.setFillColor(241, 245, 249); // slate-100
            doc.rect(margin, y - 2, maxWidth, 8, "F");
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Item", margin + 2, y + 3);
            doc.text("Qty", margin + 100, y + 3);
            doc.text("Est. Cost", margin + 130, y + 3);
            y += 10;

            // Table rows
            doc.setFont("helvetica", "normal");
            for (const material of materials) {
              checkNewPage(8);
              const itemLines = doc.splitTextToSize(material.item || "", 90);
              doc.text(itemLines[0] || "", margin + 2, y);
              doc.text(material.quantity || "-", margin + 100, y);
              doc.text(material.estimatedCost || "-", margin + 130, y);
              y += 6;
              // Handle multi-line item names
              for (let j = 1; j < itemLines.length; j++) {
                checkNewPage();
                doc.text(itemLines[j], margin + 2, y);
                y += 5;
              }
            }
            y += 6;
          }
        } catch {
          // If JSON parsing fails, skip materials
        }
      }

      // Add materials disclaimer if needed
      if ((hasOverride || aiMaterials) && showMaterialsDisclaimer) {
        checkNewPage(12);
        doc.setFillColor(254, 243, 199); // amber-100
        doc.rect(margin, y - 2, maxWidth, 10, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(180, 83, 9); // amber-700
        doc.text("Note: Material prices are an estimate only and must be checked against current supplier pricing.", margin + 4, y + 4);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        y += 14;
      }

      // =========================================
      // CLIENT NOTES
      // =========================================
      if (aiClientNotes) {
        addSectionHeading("Notes for Client");
        addWrappedText(aiClientNotes, 11);
      }

      // =========================================
      // JOB NOTES (original tradie notes)
      // =========================================
      if (notes) {
        addSectionHeading("Job Details");
        addWrappedText(notes, 10);
      }

      // =========================================
      // CLIENT ACCEPTANCE & SIGNATURE
      // =========================================
      if (clientAcceptedAt && (clientAcceptedByName || clientSignedName)) {
        checkNewPage(80);
        y += 10;
        addSectionHeading("Client Acceptance");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        // Add signature image first if available
        if (clientSignature?.signatureImage) {
          try {
            checkNewPage(50);
            y += 5;
            // Add signature image (scale to reasonable size)
            const imgWidth = 80;
            const imgHeight = 30;
            doc.addImage(
              clientSignature.signatureImage,
              "PNG",
              margin,
              y,
              imgWidth,
              imgHeight
            );
            y += imgHeight + 8;
          } catch (imgError) {
            console.warn("Failed to add signature image to PDF:", imgError);
            // Continue without image
          }
        }
        
        // Accepted by (prefer clientAcceptedByName, fallback to clientSignedName)
        const acceptedByName = clientAcceptedByName || clientSignedName || "Unknown";
        addWrappedText(`Accepted by: ${acceptedByName}`, 11);
        
        if (clientSignedEmail) {
          addWrappedText(`Email: ${clientSignedEmail}`, 11);
        }
        
        addWrappedText(
          `Accepted on: ${new Date(clientAcceptedAt).toLocaleString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          11
        );
        
        // Quote version info
        if (quoteNumber && clientAcceptedQuoteVer) {
          addWrappedText(`Quote: ${quoteNumber} v${clientAcceptedQuoteVer}`, 11);
        }
        
        // Client note if present
        if (clientAcceptanceNote && clientAcceptanceNote.trim()) {
          y += 5;
          doc.setFont("helvetica", "bold");
          addWrappedText("Client note:", 11);
          doc.setFont("helvetica", "normal");
          addWrappedText(clientAcceptanceNote, 10);
        }
        
        y += 5;
      }

      // =========================================
      // FOOTER
      // =========================================
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Generated by OMNEXORA  •  Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const filename = `job-pack-${jobId.slice(0, 8)}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadPdf}
      disabled={isGenerating}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Download job pack as PDF"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-1.5" />
          <span>Download PDF</span>
        </>
      )}
    </button>
  );
}

