"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Save, AlertCircle, Loader2, RefreshCw, Copy, Mail, Download, Lock, Check, FileCheck, Building2 } from "lucide-react";
import DocPreview from "./DocPreview";
import type { RenderModel, DocType, RenderSection, RenderField, RenderTable, DocumentStatus, IssuerProfile } from "@/lib/docEngine/types";
import { featureFlags } from "@/lib/featureFlags";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import type { SafeUser } from "@/lib/auth";

interface DocEditorProps {
  jobId: string;
  docType: DocType;
  onClose: () => void;
  onSave?: (model: RenderModel) => void;
  user?: SafeUser | null;
  planTier?: string;
  planStatus?: string;
  clientEmail?: string;
  clientName?: string;
  jobTitle?: string;
  address?: string;
}

/**
 * Document Editor Component
 * 
 * Provides a full-screen editor for document templates with:
 * - Pre-filled data from job/client/company
 * - Inline editing of all fields
 * - Auto-save on debounce
 * - OVIS warnings display
 * - Regenerate from job pack (non-destructive merge)
 */
export default function DocEditor({ 
  jobId, 
  docType, 
  onClose, 
  onSave,
  user = null,
  planTier = "FREE",
  planStatus = "TRIAL",
  clientEmail = "",
  clientName = "",
  jobTitle = "",
  address = "",
}: DocEditorProps) {
  const [model, setModel] = useState<RenderModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  
  // Document lifecycle state
  const [docStatus, setDocStatus] = useState<DocumentStatus>("DRAFT");
  const [issuedRecordId, setIssuedRecordId] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [issuer, setIssuer] = useState<IssuerProfile | null>(null);
  
  // Issue modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueValidation, setIssueValidation] = useState<{
    missingRequired: string[];
    missingRecommended: string[];
    warnings: string[];
  } | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  // Load draft or generate new
  useEffect(() => {
    if (!featureFlags.DOC_ENGINE_V1) {
      setError("Document engine V1 is not enabled");
      setLoading(false);
      return;
    }

    loadDocument();
  }, [jobId, docType]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load existing draft
      const draftResponse = await fetch(
        `/api/docs/draft?jobId=${encodeURIComponent(jobId)}&docType=${encodeURIComponent(docType)}`
      );

      if (draftResponse.ok) {
        const draftData = await draftResponse.json();
        if (draftData.draft?.data) {
          setModel(draftData.draft.data);
          setApproved(draftData.draft.approved ?? false);
          // Set lifecycle state
          setDocStatus(draftData.draft.status ?? "DRAFT");
          setIssuedRecordId(draftData.draft.issuedRecordId ?? null);
          setIssuedAt(draftData.draft.issuedAt ?? null);
          setIssuer(draftData.draft.issuer ?? null);
          setLoading(false);
          return;
        }
      }

      // No draft exists, generate from template
      await generateFromTemplate();
    } catch (err: any) {
      console.error("[DocEditor] Load error:", err);
      setError(err?.message || "Failed to load document");
      setLoading(false);
    }
  };

  const generateFromTemplate = async () => {
    try {
      setLoading(true);
      
      // Call the prefill API endpoint
      // Default: exclude markup for client-facing documents (includeMaterialsMarkup: false)
      const response = await fetch(`/api/docs/prefill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobId, 
          docType,
          includeMaterialsMarkup: false, // Default: exclude markup for client-facing docs
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate document");
      }

      const data = await response.json();
      if (data.model) {
        setModel(data.model);
        hasUnsavedChanges.current = true;
        // Auto-save the generated model
        await saveDraft(data.model);
      } else {
        throw new Error("No model returned from prefill");
      }
    } catch (err: any) {
      console.error("[DocEditor] Generate error:", err);
      const errorMessage = err?.message || "Failed to generate document";
      
      // Provide more helpful error messages
      if (errorMessage.includes("Document engine V1 is not enabled")) {
        setError("Document engine is not enabled. Please enable DOC_ENGINE_V1 feature flag.");
      } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("Forbidden")) {
        setError("You don't have permission to generate this document.");
      } else if (errorMessage.includes("Job not found")) {
        setError("Job not found. Please refresh the page and try again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (modelToSave: RenderModel) => {
    try {
      setSaving(true);
      setSaveStatus("saving");

      const response = await fetch(`/api/docs/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          docType,
          data: modelToSave,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save draft");
      }

      setSaveStatus("saved");
      hasUnsavedChanges.current = false;
      
      // Clear saved status after 2 seconds
      setTimeout(() => {
        if (saveStatus === "saved") {
          setSaveStatus("idle");
        }
      }, 2000);
    } catch (err: any) {
      console.error("[DocEditor] Save error:", err);
      setSaveStatus("error");
      setError(err?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = useCallback((updatedModel: RenderModel) => {
    setModel(updatedModel);
    hasUnsavedChanges.current = true;
    setSaveStatus("idle");

    // Debounce auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(updatedModel);
    }, 800);
  }, []);

  const handleRegenerate = async () => {
    if (!confirm("Regenerate from Job Pack? This will only fill empty fields and won't overwrite your edits.")) {
      return;
    }

    try {
      setRegenerating(true);
      setError(null);

      // Load current model for merge
      const currentModel = model;
      
      // Generate fresh model (preserve markup preference from current model if available)
      const currentIncludeMarkup = (currentModel as any)?.includeMaterialsMarkup ?? false;
      const response = await fetch(`/api/docs/prefill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobId, 
          docType,
          includeMaterialsMarkup: currentIncludeMarkup,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to regenerate");
      }

      const freshModel = await response.json().then((d) => d.model);

      // Non-destructive merge: only fill empty fields
      const mergedModel: RenderModel = {
        ...freshModel,
        sections: freshModel.sections.map((section: any, idx: number) => {
          const currentSection = currentModel?.sections[idx];
          if (!currentSection) return section;

          return {
            ...section,
            fields: section.fields?.map((field: any, fIdx: number) => {
              const currentField = currentSection.fields?.[fIdx];
              if (currentField && currentField.value !== null && currentField.value !== "") {
                return currentField; // Keep user's value
              }
              return field; // Use fresh value
            }),
            table: section.table ? {
              ...section.table,
              rows: section.table.rows.map((row: any, rIdx: number) => {
                const currentRow = currentSection.table?.rows[rIdx];
                if (!currentRow) return row;

                const mergedRow: any = {};
                Object.keys(row).forEach((key) => {
                  const currentValue = currentRow[key];
                  if (currentValue !== null && currentValue !== "" && currentValue !== undefined) {
                    mergedRow[key] = currentValue; // Keep user's value
                  } else {
                    mergedRow[key] = row[key]; // Use fresh value
                  }
                });
                return mergedRow;
              }),
            } : undefined,
          };
        }),
      };

      setModel(mergedModel);
      await saveDraft(mergedModel);
    } catch (err: any) {
      console.error("[DocEditor] Regenerate error:", err);
      setError(err?.message || "Failed to regenerate document");
    } finally {
      setRegenerating(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges.current) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  };

  // Approve document (hides warnings in exports)
  const handleApprove = async () => {
    if (!model) return;
    
    if (!confirm("Approve this document? Warnings will be hidden in PDFs and exports.")) {
      return;
    }

    setApproving(true);
    try {
      // Save approval status to draft
      const response = await fetch(`/api/docs/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          docType,
          data: model,
          approved: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve document");
      }

      setApproved(true);
      hasUnsavedChanges.current = false;
    } catch (err: any) {
      console.error("Failed to approve:", err);
      setError(err?.message || "Failed to approve document");
    } finally {
      setApproving(false);
    }
  };

  // Issue document for client export
  const handleIssue = async () => {
    if (!model) return;
    
    setIssuing(true);
    setIssueValidation(null);
    
    try {
      const response = await fetch(`/api/docs/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          docType,
          strict: true, // Require all mandatory fields
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check if it's a validation error with missing fields
        if (data.validation) {
          setIssueValidation(data.validation);
        }
        throw new Error(data.error || "Failed to issue document");
      }

      // Success - update state
      setDocStatus("ISSUED");
      setIssuedRecordId(data.draft.issuedRecordId);
      setIssuedAt(data.draft.issuedAt);
      setIssuer(data.issuer);
      setApproved(true);
      setShowIssueModal(false);
      hasUnsavedChanges.current = false;
      
      // Show warnings if any
      if (data.validation?.warnings?.length > 0) {
        alert(`Document issued successfully!\n\nNote: ${data.validation.warnings.join("\n")}`);
      }
    } catch (err: any) {
      console.error("Failed to issue:", err);
      // Don't close modal on error - show the validation feedback
      if (!issueValidation) {
        setError(err?.message || "Failed to issue document");
      }
    } finally {
      setIssuing(false);
    }
  };

  // Convert RenderModel to plain text for copying/emailing (excludes warnings if approved)
  const modelToText = useCallback((model: RenderModel, isApproved: boolean): string => {
    const lines: string[] = [];
    
    lines.push(model.title);
    lines.push("");
    lines.push(`Record ID: ${model.recordId}`);
    lines.push(`Generated: ${new Date(model.timestamp).toLocaleString("en-AU")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    
    model.sections.forEach((section) => {
      if (section.title) {
        lines.push(section.title.toUpperCase());
        lines.push("");
      }
      
      // Add fields
      if (section.fields && section.fields.length > 0) {
        section.fields.forEach((field) => {
          const value = field.value !== null && field.value !== undefined ? String(field.value) : "";
          if (value || field.required) {
            lines.push(`${field.label}: ${value || "[Required]"}`);
          }
        });
        lines.push("");
      }
      
      // Add table
      if (section.table && section.table.rows.length > 0) {
        const columns = section.table.columns;
        const headers = columns.map((col) => col.label).join(" | ");
        lines.push(headers);
        lines.push("-".repeat(headers.length));
        
        section.table.rows.forEach((row) => {
          const rowValues = columns.map((col) => {
            const value = row[col.id];
            return value !== null && value !== undefined ? String(value) : "";
          });
          lines.push(rowValues.join(" | "));
        });
        lines.push("");
      }
    });
    
    // Only include disclaimer if not approved
    if (!isApproved) {
      lines.push("---");
      lines.push("");
      lines.push(model.disclaimer);
    }
    
    return lines.join("\n");
  }, []);

  // Check access for document features
  const hasAccess = hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: user?.isAdmin ?? false });
  const accessMessage = "A paid plan or pilot program membership is required. Free users can create job packs only.";

  // Copy document text
  const handleCopy = useCallback(async () => {
    if (!model) return;
    
    try {
      const text = modelToText(model, approved);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [model, modelToText, approved]);

  // Email document to client
  const handleEmail = useCallback(() => {
    if (!hasAccess) {
      alert(accessMessage);
      return;
    }

    if (!clientEmail) {
      alert("Client email not set for this job");
      return;
    }

    if (!model) {
      alert("No document content to email");
      return;
    }

    const text = modelToText(model, approved);
    const docLabel = model.title;
    const subject = `${docLabel} - ${jobTitle || "Job"}`;
    const body = `Hi ${clientName || "there"},\n\nPlease find the ${docLabel.toLowerCase()} for the following job:\n\nJob: ${jobTitle || "N/A"}\n${address ? `Address: ${address}\n` : ""}\n---\n\n${text}\n\n---\n\nKind regards`;
    
    const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }, [model, hasAccess, accessMessage, clientEmail, clientName, jobTitle, address, modelToText, approved]);

  // Download PDF (internal draft)
  const handleDownloadPdf = useCallback(async (audience: "INTERNAL" | "CLIENT" = "INTERNAL") => {
    if (!hasAccess) {
      alert(accessMessage);
      return;
    }

    if (!model) {
      alert("No document content to download");
      return;
    }

    // For CLIENT export, must be issued or have valid issuer profile
    if (audience === "CLIENT" && docStatus !== "ISSUED") {
      setShowIssueModal(true);
      return;
    }

    setDownloading(true);
    try {
      const response = await fetch(`/api/docs/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          docType,
          recordId: model.recordId,
          renderModel: model,
          audience,
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
      const filenameId = (audience === "CLIENT" && issuedRecordId) ? issuedRecordId : model.recordId;
      a.download = `${docType.toLowerCase()}-${filenameId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }, [model, hasAccess, accessMessage, jobId, docType, docStatus, issuedRecordId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !model) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-900">Error</h2>
          </div>
          <p className="text-slate-600 mb-6">{error}</p>
          {error.includes("Document engine V1 is not enabled") && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The template-driven document engine requires the DOC_ENGINE_V1 feature flag to be enabled.
                <br />
                <br />
                Add <code className="bg-amber-100 px-1 rounded">DOC_ENGINE_V1=true</code> to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file and restart the server.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Close
            </button>
            <button
              onClick={loadDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{model.title}</h2>
          {/* Document status badge */}
          {docStatus === "ISSUED" ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              Issued for Client
            </span>
          ) : approved ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              Approved
            </span>
          ) : (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
              Draft – Review required
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-green-600 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-600">Save failed</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Copy Button - Always available */}
          <button
            onClick={handleCopy}
            disabled={!model}
            className="px-3 py-2 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            title="Copy document text"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
          
          {/* Email Button - Requires access */}
          <button
            onClick={handleEmail}
            disabled={!hasAccess || !clientEmail || !model}
            className="px-3 py-2 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={!hasAccess ? accessMessage : !clientEmail ? "Client email not set" : "Email to client"}
          >
            {!hasAccess ? (
              <>
                <Lock className="w-4 h-4" />
                Email
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Email
              </>
            )}
          </button>
          
          {/* Download Internal PDF Button */}
          <button
            onClick={() => handleDownloadPdf("INTERNAL")}
            disabled={!hasAccess || downloading || !model}
            className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={!hasAccess ? accessMessage : "Download draft PDF (internal use)"}
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : !hasAccess ? (
              <>
                <Lock className="w-4 h-4" />
                Draft PDF
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Draft PDF
              </>
            )}
          </button>
          
          {/* Issue / Export Client PDF Button */}
          {docStatus === "ISSUED" ? (
            <button
              onClick={() => handleDownloadPdf("CLIENT")}
              disabled={!hasAccess || downloading || !model}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Export client-facing PDF"
            >
              <FileCheck className="w-4 h-4" />
              Client PDF
            </button>
          ) : (
            <button
              onClick={() => setShowIssueModal(true)}
              disabled={!hasAccess || !model}
              className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Issue document for client export"
            >
              <Building2 className="w-4 h-4" />
              Issue for Client
            </button>
          )}
          
          {!approved && docStatus !== "ISSUED" && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              title="Approve document to hide warnings in exports"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve
                </>
              )}
            </button>
          )}
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
          <button
            onClick={handleClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* OVIS Warnings - Only show if not approved */}
      {!approved && model.ovisWarnings && model.ovisWarnings.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">
                OVIS (Output Variance & Integrity Signals)
              </p>
              <p className="text-xs text-amber-800 mb-2">
                OVIS highlights possible missing information or inconsistencies. OVIS checks are warnings only and not certification. Review required.
              </p>
              <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                {model.ovisWarnings.map((warning) => (
                  <li key={warning.id}>{warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <DocPreview
          model={model}
          onModelChange={handleModelChange}
          editable={true}
        />
      </div>

      {/* Footer Disclaimer - Only show if not approved and not issued */}
      {!approved && docStatus !== "ISSUED" && (
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-600 text-center">
            {model.disclaimer}
          </p>
        </div>
      )}
      
      {/* Issued info footer */}
      {docStatus === "ISSUED" && issuedRecordId && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
          <p className="text-xs text-blue-700 text-center">
            Document issued for client export • ID: {issuedRecordId}
            {issuedAt && ` • Issued: ${new Date(issuedAt).toLocaleString("en-AU")}`}
          </p>
        </div>
      )}

      {/* Issue Document Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Issue Document for Client</h3>
                  <p className="text-sm text-slate-500">Create a professional client-facing export</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueValidation(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4">
              {/* Validation Errors */}
              {issueValidation && issueValidation.missingRequired.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 mb-2">Missing Required Business Details</p>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {issueValidation.missingRequired.map((field, i) => (
                          <li key={i}>{field}</li>
                        ))}
                      </ul>
                      <a 
                        href="/settings/business-profile" 
                        className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-red-700 hover:text-red-800"
                      >
                        Complete Business Profile →
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Warning about issuing */}
              {(!issueValidation || issueValidation.missingRequired.length === 0) && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>Important:</strong> You are issuing this document on behalf of your business. 
                    Once issued, it represents your business and should be accurate, complete, and suitable for the client.
                  </p>
                </div>
              )}
              
              {/* What happens when issued */}
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">When you issue this document:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Your business details appear as the document issuer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>A unique document ID is generated for tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>The exported PDF will be professional and client-ready</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Draft warnings are removed from client exports</span>
                  </li>
                </ul>
              </div>
              
              {/* Recommended fields warning */}
              {issueValidation && issueValidation.missingRecommended.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600">
                    <strong>Tip:</strong> Consider adding {issueValidation.missingRecommended.join(", ")} to your business profile for a more professional appearance.
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueValidation(null);
                }}
                className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleIssue}
                disabled={issuing || (issueValidation !== null && issueValidation.missingRequired.length > 0)}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {issuing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Confirm & Issue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

