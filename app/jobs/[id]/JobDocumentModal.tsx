"use client";

import { useState } from "react";
import { Copy, Check, Download, X } from "lucide-react";
import { PdfDocument, parseStructuredContent } from "@/lib/pdfGenerator";
import AIWarningBanner from "@/app/components/AIWarningBanner";
import OvisBadge from "@/app/components/OvisBadge";

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

interface JobDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null;
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  clientName?: string;
  documentType: "SWMS" | "VARIATION" | "EOT" | "PROGRESS_CLAIM" | "HANDOVER" | "MAINTENANCE";
  showWarning?: boolean;
  businessProfile?: BusinessProfile | null;
}

const DOCUMENT_LABELS: Record<JobDocumentModalProps["documentType"], string> = {
  SWMS: "Safe Work Method Statement",
  VARIATION: "Variation / Change Order",
  EOT: "Extension of Time Notice",
  PROGRESS_CLAIM: "Progress Claim / Tax Invoice",
  HANDOVER: "Handover & Practical Completion Checklist",
  MAINTENANCE: "Maintenance & Care Guide",
};

export default function JobDocumentModal({
  isOpen,
  onClose,
  title,
  content,
  jobId,
  jobTitle,
  tradeType,
  address,
  clientName,
  documentType,
  showWarning = false,
  businessProfile,
}: JobDocumentModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadPdf = () => {
    if (!content) return;

    try {
      const pdf = new PdfDocument();
      const documentNumber = `${documentType}-${jobId.slice(0, 8).toUpperCase()}`;
      const documentDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // =========================================
      // PREMIUM DOCUMENT HEADER
      // =========================================
      pdf.addPremiumDocumentHeader({
        documentType: DOCUMENT_LABELS[documentType],
        documentNumber,
        documentDate,
        issuer: businessProfile?.legalName ? {
          legalName: businessProfile.legalName,
          tradingName: businessProfile.tradingName,
          abn: businessProfile.abn,
          email: businessProfile.email,
          phone: businessProfile.phone,
          addressLine1: businessProfile.addressLine1,
          suburb: businessProfile.suburb,
          state: businessProfile.state,
          postcode: businessProfile.postcode,
        } : undefined,
        recipient: clientName ? {
          name: clientName,
          address: address,
        } : undefined,
        jobReference: jobId.slice(0, 8).toUpperCase(),
        projectName: jobTitle,
        projectAddress: address,
      });

      // =========================================
      // AUSTRALIAN COMPLIANCE REFERENCE
      // =========================================
      pdf.addAustralianComplianceReference(businessProfile?.state || "WA");

      // =========================================
      // AI WARNING (only for internal/no business profile)
      // =========================================
      if (!businessProfile?.legalName) {
        pdf.addAiWarning();
      }

      // =========================================
      // DOCUMENT CONTENT
      // =========================================
      pdf.addSectionHeading(title);
      
      const sections = parseStructuredContent(content);
      for (const section of sections) {
        switch (section.type) {
          case "heading":
            pdf.addSubheading(section.content);
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
      // PREMIUM FOOTER
      // =========================================
      pdf.addPremiumFooter({
        issuerName: businessProfile?.legalName || "OMNEXORA",
        documentId: documentNumber,
        stateCode: businessProfile?.state || "WA",
        includeComplianceNote: true,
      });

      // Save the PDF
      const filename = `${documentType.toLowerCase()}-${jobId.slice(0, 8)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <OvisBadge variant="inline" size="sm" />
            </div>
            <p className="text-xs text-slate-500">{DOCUMENT_LABELS[documentType]}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        {showWarning && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
            <p className="text-sm text-amber-800">
              This job has already been sent to the client. Use Variations, EOTs and new documents to record changes - do not overwrite the original quote.
            </p>
          </div>
        )}

        {/* AI Warning Banner */}
        <div className="px-6 py-4 border-b border-amber-200">
          <AIWarningBanner variant="compact" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content ? (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                {content}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No content available</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            {content && (
              <>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
