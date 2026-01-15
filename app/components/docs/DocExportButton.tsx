"use client";

import { useState } from "react";
import { FileText, FileDown, Loader2 } from "lucide-react";
import type { DocType, RenderModel } from "@/lib/docEngine/types";

interface DocExportButtonProps {
  jobId: string;
  docType: DocType;
  recordId: string;
  renderModel?: RenderModel;
  disabled?: boolean;
}

/**
 * DocExportButton - Export documents in PDF or Word format
 * 
 * Word Export Features:
 * - Consistent table formatting
 * - Proper fonts (Calibri)
 * - Clean professional styling
 */
export default function DocExportButton({
  jobId,
  docType,
  recordId,
  renderModel,
  disabled = false,
}: DocExportButtonProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
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
          renderModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
        throw new Error(errorData.error || "Failed to generate PDF");
      }

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
      setIsGeneratingPdf(false);
    }
  };

  const handleExportWord = async () => {
    setIsGeneratingWord(true);
    setError(null);

    try {
      const response = await fetch(`/api/docs/render-word`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          docType,
          recordId,
          renderModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate Word document" }));
        throw new Error(errorData.error || "Failed to generate Word document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType.toLowerCase()}-${recordId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export Word document");
      console.error("Word export error:", err);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const isGenerating = isGeneratingPdf || isGeneratingWord;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* PDF Export Button */}
        <button
          onClick={handleExportPdf}
          disabled={disabled || isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              PDF
            </>
          )}
        </button>

        {/* Word Export Button */}
        <button
          onClick={handleExportWord}
          disabled={disabled || isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isGeneratingWord ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Word
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <p className="text-xs text-slate-500">
        Review required before use. Not certified or verified.
      </p>
    </div>
  );
}

