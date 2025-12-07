"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Copy, Check, Download, Save, Edit2 } from "lucide-react";
import { jsPDF } from "jspdf";

interface SwmsSectionProps {
  jobId: string;
  swmsText?: string | null;
  jobTitle?: string;
  tradeType?: string;
  address?: string;
}

/**
 * SWMS (Safe Work Method Statement) Section Component
 * 
 * Features:
 * - Generate SWMS using AI
 * - Regenerate existing SWMS
 * - Copy SWMS to clipboard
 * - Download SWMS as PDF
 * - Manual edit and save functionality
 * - Error handling with fallback to manual entry
 */
export default function SwmsSection({
  jobId,
  swmsText: initialSwmsText,
  jobTitle = "Job",
  tradeType = "Trade",
  address = "Location not specified",
}: SwmsSectionProps) {
  const router = useRouter();
  const [swmsText, setSwmsText] = useState<string | null>(initialSwmsText || null);
  const [editedSwmsText, setEditedSwmsText] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setSwmsText(initialSwmsText || null);
    setEditedSwmsText(initialSwmsText || "");
  }, [initialSwmsText]);

  // Start editing mode
  const handleStartEdit = () => {
    setEditedSwmsText(swmsText || "");
    setIsEditing(true);
    setError(null);
    setSaveSuccess(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSwmsText(swmsText || "");
    setError(null);
  };

  // Generate or regenerate SWMS
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setIsEditing(false);

    try {
      const response = await fetch(`/api/jobs/${jobId}/swms`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate SWMS");
      }

      const data = await response.json();
      if (data.success && data.swms) {
        setSwmsText(data.swms);
        setEditedSwmsText(data.swms);
        // Refresh server-side data to ensure consistency
        router.refresh();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate SWMS";
      setError(errorMessage);
      // On error, allow manual editing
      setIsEditing(true);
      setEditedSwmsText(swmsText || "");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save manually edited SWMS
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/jobs/${jobId}/swms`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ swmsText: editedSwmsText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save SWMS");
      }

      const data = await response.json();
      if (data.success) {
        setSwmsText(editedSwmsText);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        router.refresh();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SWMS");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy SWMS to clipboard
  const handleCopy = async () => {
    const textToCopy = isEditing ? editedSwmsText : (swmsText || "");
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy SWMS:", err);
      setError("Failed to copy to clipboard");
    }
  };

  // Download SWMS as PDF
  const handleDownloadPdf = () => {
    const textToDownload = isEditing ? editedSwmsText : (swmsText || "");
    if (!textToDownload) return;

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

      // Header
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 0, pageWidth, 35, "F");

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("OMNEXORA", margin, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Safe Work Method Statement (SWMS)", margin, 26);

      y = 50;
      doc.setTextColor(0, 0, 0);

      // Job details
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Job Details", margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addWrappedText(`Job Title: ${jobTitle}`, 11);
      addWrappedText(`Trade Type: ${tradeType}`, 11);
      addWrappedText(`Address: ${address}`, 11);
      y += 4;

      // SWMS content
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      checkNewPage(20);
      doc.text("Safe Work Method Statement", margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addWrappedText(textToDownload, 11);

      // Footer
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
      const filename = `swms-${jobId.slice(0, 8)}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              SWMS (Safe Work Method Statement) – Beta
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generate a Safe Work Method Statement for this job
            </p>
          </div>
          <div className="flex items-center gap-2">
            {swmsText && !isEditing && (
              <>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy SWMS
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download SWMS (PDF)
                </button>
              </>
            )}
            {swmsText && !isEditing && !isGenerating && (
              <button
                onClick={handleGenerate}
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
              >
                Regenerate SWMS
              </button>
            )}
            {!swmsText && !isGenerating && (
              <button
                onClick={handleGenerate}
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
              >
                Generate SWMS
              </button>
            )}
            {isGenerating && (
              <button
                disabled
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-slate-900 font-medium rounded-lg opacity-50 cursor-not-allowed text-sm"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {!swmsText && (
                  <p className="text-sm text-red-600 mt-2">
                    Couldn&apos;t generate SWMS right now. Please try again or write your own notes below.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium text-green-800">SWMS saved successfully</p>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedSwmsText}
              onChange={(e) => setEditedSwmsText(e.target.value)}
              className="w-full min-h-[400px] p-4 border border-slate-300 rounded-lg font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter your SWMS content here..."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save SWMS
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : swmsText ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                {swmsText}
              </pre>
            </div>
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit SWMS
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No SWMS generated yet.</h3>
            <p className="text-slate-500 text-sm mb-6">
              Click &ldquo;Generate SWMS&rdquo; to create a Safe Work Method Statement for this job.
            </p>
            {error && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Write your own SWMS
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

