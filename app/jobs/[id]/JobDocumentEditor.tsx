"use client";

import { useState } from "react";
import { Loader2, Save, X, Check, Edit2, Copy, Download, Mail, Lock } from "lucide-react";
import AIWarningBanner from "@/app/components/AIWarningBanner";
import OvisBadge from "@/app/components/OvisBadge";

interface JobDocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null;
  jobId: string;
  documentType: "SWMS" | "VARIATION" | "EOT" | "PROGRESS_CLAIM" | "HANDOVER" | "MAINTENANCE";
  isConfirmed: boolean;
  onSave: (content: string, confirmed: boolean) => Promise<void>;
  jobTitle?: string;
  tradeType?: string;
  address?: string;
  clientName?: string;
  clientEmail?: string;
  hasAccess?: boolean;
  accessMessage?: string;
}

export default function JobDocumentEditor({
  isOpen,
  onClose,
  title,
  content: initialContent,
  jobId,
  documentType,
  isConfirmed,
  onSave,
  jobTitle = "",
  tradeType = "",
  address = "",
  clientName = "",
  clientEmail = "",
  hasAccess = false,
  accessMessage = "",
}: JobDocumentEditorProps) {
  const [content, setContent] = useState(initialContent || "");
  const [isEditing, setIsEditing] = useState(!isConfirmed);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Document content cannot be empty");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await onSave(content.trim(), true); // Save and confirm
      setIsEditing(false);
      setSuccess("Document saved and confirmed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      setError("Document content cannot be empty");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await onSave(content.trim(), false); // Save without confirming
      setSuccess("Draft saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent || "");
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  const handleEmail = () => {
    if (!hasAccess) {
      setError(accessMessage);
      return;
    }

    if (!clientEmail) {
      setError("Client email not set for this job");
      return;
    }

    if (!content) {
      setError("No content to email");
      return;
    }

    const subject = `${title} - ${jobTitle}`;
    const body = `Hi ${clientName || "there"},\n\nPlease find the ${title.toLowerCase()} for the following job:\n\nJob: ${jobTitle}\n${address ? `Address: ${address}\n` : ""}\n---\n\n${content}\n\n---\n\nKind regards`;
    
    const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleDownloadPdf = async () => {
    if (!hasAccess) {
      setError(accessMessage);
      return;
    }

    if (!content) {
      setError("No content to download");
      return;
    }

    setIsDownloading(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/documents/${documentType.toLowerCase()}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType.toLowerCase()}-${jobId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <OvisBadge variant="inline" size="sm" />
              {isConfirmed && !isEditing && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <Check className="w-3 h-3 mr-1" />
                  Confirmed
                </span>
              )}
              {!isConfirmed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Draft - Review Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isEditing ? "Edit the document content below, then confirm to use it" : "Review the document content"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Warning Banner */}
        <div className="px-6 py-4 border-b border-amber-200">
          <AIWarningBanner variant="compact" />
        </div>

        {/* Messages */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200">
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* Content Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[400px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono text-sm leading-relaxed"
              placeholder="Enter document content..."
              disabled={isSaving}
            />
          ) : (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                {content || "No content available"}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving || !content.trim()}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
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
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleEmail}
                      disabled={!hasAccess || !clientEmail}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!hasAccess ? accessMessage : !clientEmail ? "Client email not set" : "Email to client"}
                    >
                      {!hasAccess ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Email
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={!hasAccess || isDownloading}
                      className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!hasAccess ? accessMessage : "Download PDF"}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : !hasAccess ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          PDF
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
                className="inline-flex items-center px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Save
                  </>
                )}
              </button>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

