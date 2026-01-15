"use client";

import { useState } from "react";
import { Download, Loader2, AlertCircle, Lock } from "lucide-react";

/**
 * R9, R10: Job Pack PDF Download Button
 * 
 * Uses server-side PDF generation for proper export gating:
 * - R10: Payment gate enforced server-side
 * - R1: Confirmation required for exports
 * - R4: Totals reconciliation checked server-side
 * 
 * All PDF generation happens server-side to prevent bypass of export gates.
 */

interface JobPackPdfButtonProps {
  jobId: string;
  // Other props are no longer needed since PDF is generated server-side
  // Keeping minimal props for potential future client-side preview
  aiReviewStatus?: "pending" | "confirmed";
}

export default function JobPackPdfButton({
  jobId,
  aiReviewStatus,
}: JobPackPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setError(null);
    setErrorCode(null);

    try {
      // R9, R10: Call server endpoint for PDF generation with proper export gates
      const response = await fetch(`/api/jobs/${jobId}/pack-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
        
        // Set error code for special handling
        setErrorCode(errorData.code || null);
        
        // Handle specific error cases
        if (errorData.code === "PAID_PLAN_REQUIRED") {
          setError("A paid plan is required to download PDFs. Please upgrade to continue.");
        } else if (errorData.code === "CONFIRMATION_REQUIRED") {
          setError("Please confirm the AI pack before downloading. Review the content and click 'Mark AI pack as confirmed'.");
        } else if (errorData.code === "TOTALS_MISMATCH") {
          setError("Materials totals don't match. Please recalculate in Materials Management before exporting.");
        } else {
          setError(errorData.error || "Failed to generate PDF. Please try again.");
        }
        return;
      }

      // Success - download the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-pack-${jobId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError("Failed to download PDF. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Show confirmation required hint for unconfirmed packs
  const isUnconfirmed = aiReviewStatus !== "confirmed";

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isUnconfirmed ? "Confirm the AI pack first to enable PDF download" : "Download job pack as PDF"}
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

      {/* Error message display */}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 mt-1 max-w-xs">
          {errorCode === "PAID_PLAN_REQUIRED" ? (
            <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          )}
          <span>{error}</span>
        </div>
      )}

      {/* Hint for unconfirmed packs (only show if no error) */}
      {isUnconfirmed && !error && (
        <p className="text-xs text-amber-600 mt-0.5">
          Confirm AI pack to enable export
        </p>
      )}
    </div>
  );
}
