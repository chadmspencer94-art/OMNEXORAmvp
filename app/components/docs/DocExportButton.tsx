"use client";

import { useState } from "react";
import type { DocType, RenderModel } from "@/lib/docEngine/types";

interface DocExportButtonProps {
  jobId: string;
  docType: DocType;
  recordId: string;
  renderModel?: RenderModel;
  disabled?: boolean;
}

export default function DocExportButton({
  jobId,
  docType,
  recordId,
  renderModel,
  disabled = false,
}: DocExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/docs/render`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          docType,
          recordId,
          renderModel, // Include edited model if provided
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Get PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType.toLowerCase()}-${recordId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export PDF");
      console.error("PDF export error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={disabled || isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <p className="text-xs text-slate-500">
        Review required before use. Not certified or verified.
      </p>
    </div>
  );
}

