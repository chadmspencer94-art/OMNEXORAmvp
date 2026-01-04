"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PdfDocument, formatCurrency, formatDate, formatDateTime } from "@/lib/pdfGenerator";
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

    // Fetch client signature if exists
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
      const pdf = new PdfDocument();

      // =========================================
      // HEADER
      // =========================================
      pdf.addBrandedHeader("Job Pack");

      // =========================================
      // JOB TITLE
      // =========================================
      pdf.addTitle(jobTitle);

      // =========================================
      // JOB METADATA
      // =========================================
      const metaItems: Array<{ label: string; value: string }> = [];
      if (tradeType) metaItems.push({ label: "Trade", value: tradeType });
      if (propertyType) metaItems.push({ label: "Property", value: propertyType });
      if (address) metaItems.push({ label: "Address", value: address });
      if (clientName) metaItems.push({ label: "Client", value: clientName });
      metaItems.push({ label: "Created", value: formatDate(jobCreatedAt) });
      pdf.addMetadata(metaItems);

      // =========================================
      // AI WARNING
      // =========================================
      pdf.addAiWarning();

      // =========================================
      // SUMMARY
      // =========================================
      if (aiSummary) {
        pdf.addSectionHeading("Summary");
        pdf.addParagraph(aiSummary);
      }

      // =========================================
      // PRICING
      // =========================================
      if (aiQuote) {
        try {
          const quote: ParsedQuote = JSON.parse(aiQuote);
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
            const estimateRange = calculateEstimateRange(aiQuote);
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
      if (aiScopeOfWork) {
        pdf.addSectionHeading("Scope of Work");
        const scopeItems = aiScopeOfWork.split("\n").filter((line) => line.trim());
        pdf.addNumberedList(scopeItems);
      }

      // =========================================
      // INCLUSIONS
      // =========================================
      if (aiInclusions) {
        pdf.addSectionHeading("What's Included");
        const inclusionItems = aiInclusions.split("\n").filter((line) => line.trim());
        pdf.addInclusionsList(inclusionItems);
      }

      // =========================================
      // EXCLUSIONS
      // =========================================
      if (aiExclusions) {
        pdf.addSectionHeading("Not Included");
        const exclusionItems = aiExclusions.split("\n").filter((line) => line.trim());
        pdf.addExclusionsList(exclusionItems);
      }

      // =========================================
      // MATERIALS
      // =========================================
      const hasOverride = materialsOverrideText && materialsOverrideText.trim().length > 0;
      const showMaterialsDisclaimer = materialsAreRoughEstimate || !hasOverride;
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
        const finalTotal = materialsTotal != null ? materialsTotal : materialsTableTotal;
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
        pdf.addParagraph(materialsOverrideText);
      } else if (aiMaterials) {
        try {
          const materials: MaterialItem[] = JSON.parse(aiMaterials);
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
          // Skip if JSON parsing fails
        }
      }

      // Materials disclaimer
      if ((hasOverride || aiMaterials || hasJobMaterials) && showMaterialsDisclaimer) {
        pdf.addText(
          "Note: Material prices are an estimate only and must be checked against current supplier pricing.",
          { fontSize: 9, color: [180, 83, 9] }
        );
        pdf.addSpace(6);
      }

      // =========================================
      // CLIENT NOTES
      // =========================================
      if (aiClientNotes) {
        pdf.addSectionHeading("Notes for Client");
        pdf.addParagraph(aiClientNotes);
      }

      // =========================================
      // JOB DETAILS
      // =========================================
      if (notes) {
        pdf.addSectionHeading("Job Details");
        pdf.addParagraph(notes);
      }

      // =========================================
      // CLIENT ACCEPTANCE
      // =========================================
      if (clientAcceptedAt && (clientAcceptedByName || clientSignedName)) {
        pdf.addSectionHeading("Client Acceptance");

        // Add signature image if available
        if (clientSignature?.signatureImage) {
          pdf.addImage(clientSignature.signatureImage, { width: 80, height: 30 });
        }

        const acceptedByName = clientAcceptedByName || clientSignedName || "Unknown";
        pdf.addParagraph(`Accepted by: ${acceptedByName}`);
        
        if (clientSignedEmail) {
          pdf.addParagraph(`Email: ${clientSignedEmail}`);
        }
        
        pdf.addParagraph(`Accepted on: ${formatDateTime(clientAcceptedAt)}`);
        
        if (quoteNumber && clientAcceptedQuoteVer) {
          pdf.addParagraph(`Quote: ${quoteNumber} v${clientAcceptedQuoteVer}`);
        }
        
        if (clientAcceptanceNote && clientAcceptanceNote.trim()) {
          pdf.addSubheading("Client note:");
          pdf.addParagraph(clientAcceptanceNote);
        }
      }

      // =========================================
      // FOOTER
      // =========================================
      pdf.addStandardFooters({ jobId });

      // Save the PDF
      const filename = `job-pack-${jobId.slice(0, 8)}.pdf`;
      pdf.save(filename);
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
