"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Check, Edit2, Copy, Download, Mail, Lock } from "lucide-react";
import JobDocumentEditor from "./JobDocumentEditor";
import OvisBadge from "@/app/components/OvisBadge";
import DocGeneratorModal from "@/app/components/docs/DocGeneratorModal";
import DocEditor from "@/app/components/docs/DocEditor";
import { featureFlags } from "@/lib/featureFlags";
import { hasDocumentFeatureAccess, getDocumentAccessMessage } from "@/lib/documentAccess";
import type { Job } from "@/lib/jobs";
import type { DocType } from "@/lib/docEngine/types";

interface JobDocumentsSectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  clientName?: string;
  clientEmail?: string;
  showWarning?: boolean;
  job?: Job; // Optional job object to check confirmation status
  user?: { isAdmin?: boolean } | null; // User info for access control
  planTier?: string; // User plan tier
  planStatus?: string; // User plan status
}

type DocumentType = "SWMS" | "VARIATION" | "EOT" | "PROGRESS_CLAIM" | "HANDOVER" | "MAINTENANCE";

interface DocumentConfig {
  type: DocumentType;
  label: string;
  apiPath: string;
  description: string;
}

const DOCUMENTS: DocumentConfig[] = [
  {
    type: "VARIATION",
    label: "Variation / change order",
    apiPath: "variation",
    description: "Use this when scope or price changes after the original quote.",
  },
  {
    type: "EOT",
    label: "Extension of time (EOT)",
    apiPath: "eot",
    description: "Request additional time to complete the work.",
  },
  {
    type: "PROGRESS_CLAIM",
    label: "Progress claim / tax invoice",
    apiPath: "progress-claim",
    description: "Invoice for completed work or progress payments.",
  },
  {
    type: "HANDOVER",
    label: "Handover & practical completion",
    apiPath: "handover",
    description: "Document final completion and handover to client.",
  },
  {
    type: "MAINTENANCE",
    label: "Maintenance & care guide",
    apiPath: "maintenance",
    description: "Provide care instructions for the completed work.",
  },
];

const DOCUMENT_STATUS_FIELDS: Record<DocumentType, { textField: keyof Job; confirmedField: keyof Job }> = {
  SWMS: { textField: "swmsText", confirmedField: "swmsConfirmed" }, // Kept for type compatibility but not displayed
  VARIATION: { textField: "variationText", confirmedField: "variationConfirmed" },
  EOT: { textField: "eotText", confirmedField: "eotConfirmed" },
  PROGRESS_CLAIM: { textField: "progressClaimText", confirmedField: "progressClaimConfirmed" },
  HANDOVER: { textField: "handoverText", confirmedField: "handoverConfirmed" },
  MAINTENANCE: { textField: "maintenanceText", confirmedField: "maintenanceConfirmed" },
};

export default function JobDocumentsSection({
  jobId,
  jobTitle,
  tradeType,
  address,
  clientName,
  clientEmail,
  showWarning = false,
  job,
  user = null,
  planTier = "FREE",
  planStatus = "TRIAL",
}: JobDocumentsSectionProps) {
  const router = useRouter();
  const [generatingDoc, setGeneratingDoc] = useState<DocumentType | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDocType, setEditorDocType] = useState<DocumentType>("SWMS");
  const [editorConfirmed, setEditorConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docGeneratorOpen, setDocGeneratorOpen] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState<DocumentType | null>(null);
  const [docEditorOpen, setDocEditorOpen] = useState(false);
  const [docEditorType, setDocEditorType] = useState<DocType | null>(null);
  const [documentStatuses, setDocumentStatuses] = useState<Record<DocumentType, { hasContent: boolean; confirmed: boolean }>>({
    SWMS: { hasContent: false, confirmed: false }, // Kept for type compatibility but not displayed
    VARIATION: { hasContent: false, confirmed: false },
    EOT: { hasContent: false, confirmed: false },
    PROGRESS_CLAIM: { hasContent: false, confirmed: false },
    HANDOVER: { hasContent: false, confirmed: false },
    MAINTENANCE: { hasContent: false, confirmed: false },
  });

  // Check if user has access to document features
  const hasAccess = hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: user?.isAdmin ?? false });
  const accessMessage = getDocumentAccessMessage(user, { planTier, planStatus, isAdmin: user?.isAdmin ?? false });

  // Load document statuses from job
  useEffect(() => {
    if (job) {
      const statuses: Record<DocumentType, { hasContent: boolean; confirmed: boolean }> = {
        SWMS: {
          hasContent: !!job.swmsText,
          confirmed: !!job.swmsConfirmed,
        }, // Kept for type compatibility but not displayed
        VARIATION: {
          hasContent: !!job.variationText,
          confirmed: !!job.variationConfirmed,
        },
        EOT: {
          hasContent: !!job.eotText,
          confirmed: !!job.eotConfirmed,
        },
        PROGRESS_CLAIM: {
          hasContent: !!job.progressClaimText,
          confirmed: !!job.progressClaimConfirmed,
        },
        HANDOVER: {
          hasContent: !!job.handoverText,
          confirmed: !!job.handoverConfirmed,
        },
        MAINTENANCE: {
          hasContent: !!job.maintenanceText,
          confirmed: !!job.maintenanceConfirmed,
        },
      };
      setDocumentStatuses(statuses);
    }
  }, [job]);

  const handleGenerate = async (doc: DocumentConfig) => {
    setGeneratingDoc(doc.type);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/${doc.apiPath}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to generate ${doc.label}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let content = "";
      let title = doc.label;
      
      if (data.success) {
        // SWMS returns { success: true, swms: content }
        if (data.swms) {
          content = data.swms;
        } 
        // Other documents return { success: true, title: "...", body: content }
        else if (data.body) {
          content = data.body;
          title = data.title || doc.label;
        } 
        // Fallback formats
        else if (data.document) {
          content = data.document;
        } else if (data.content) {
          content = data.content;
        } else if (typeof data === "string") {
          content = data;
        }
      }

      if (!content) {
        throw new Error("No content received from server");
      }

      // Save the generated content immediately (as draft)
      try {
        const saveResponse = await fetch(`/api/jobs/${jobId}/documents/${doc.type.toLowerCase()}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            confirmed: false, // Not confirmed yet - user must review
          }),
        });

        if (!saveResponse.ok) {
          console.warn("Failed to save document draft");
        }
      } catch (saveErr) {
        console.warn("Error saving document draft:", saveErr);
      }

      // Open editor with generated content
      setEditorContent(content);
      setEditorTitle(title);
      setEditorDocType(doc.type);
      setEditorConfirmed(false);
      setEditorOpen(true);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to generate ${doc.label}`;
      setError(errorMessage);
    } finally {
      setGeneratingDoc(null);
    }
  };

  // Map DocumentType to DocType for template engine
  const mapToDocType = (docType: DocumentType): DocType => {
    const mapping: Record<DocumentType, DocType> = {
      VARIATION: "VARIATION_CHANGE_ORDER",
      EOT: "EXTENSION_OF_TIME",
      PROGRESS_CLAIM: "PROGRESS_CLAIM_TAX_INVOICE",
      HANDOVER: "HANDOVER_PRACTICAL_COMPLETION",
      MAINTENANCE: "MAINTENANCE_CARE_GUIDE",
      SWMS: "SWMS", // Not used in new engine but kept for compatibility
    };
    return mapping[docType];
  };

  const handleOpenEditor = async (docType: DocumentType) => {
    // If DOC_ENGINE_V1 is enabled, use new DocEditor
    if (featureFlags.DOC_ENGINE_V1) {
      const mappedDocType = mapToDocType(docType);
      setDocEditorType(mappedDocType);
      setDocEditorOpen(true);
      return;
    }

    // Fallback to old editor
    try {
      const response = await fetch(`/api/jobs/${jobId}/documents/${docType.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setEditorContent(data.content || "");
        setEditorConfirmed(data.confirmed || false);
        setEditorTitle(DOCUMENTS.find((d) => d.type === docType)?.label || docType);
        setEditorDocType(docType);
        setEditorOpen(true);
      } else {
        setError("Failed to load document");
      }
    } catch (err) {
      setError("Failed to load document");
    }
  };

  const handleSaveDocument = async (content: string, confirmed: boolean) => {
    const response = await fetch(`/api/jobs/${jobId}/documents/${editorDocType.toLowerCase()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, confirmed }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to save document");
    }

    // Update local status
    setDocumentStatuses((prev) => ({
      ...prev,
      [editorDocType]: {
        hasContent: true,
        confirmed,
      },
    }));

    router.refresh();
  };

  const handleCopyDocument = async (docType: DocumentType) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/documents/${docType.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        const content = data.content || "";
        await navigator.clipboard.writeText(content);
        setCopiedDoc(docType);
        setTimeout(() => setCopiedDoc(null), 2000);
      } else {
        setError("Failed to copy document");
      }
    } catch (err) {
      setError("Failed to copy document");
    }
  };

  const handleEmailDocument = async (docType: DocumentType) => {
    if (!hasAccess) {
      setError(accessMessage);
      return;
    }

    if (!clientEmail) {
      setError("Client email not set for this job");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/documents/${docType.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        const content = data.content || "";
        const docLabel = DOCUMENTS.find((d) => d.type === docType)?.label || docType;
        
        const subject = `${docLabel} - ${jobTitle}`;
        const body = `Hi ${clientName || "there"},\n\nPlease find attached the ${docLabel.toLowerCase()} for the following job:\n\nJob: ${jobTitle}\n${address ? `Address: ${address}\n` : ""}\n---\n\n${content}\n\n---\n\nKind regards`;
        
        const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      } else {
        setError("Failed to load document for email");
      }
    } catch (err) {
      setError("Failed to email document");
    }
  };

  const handleDownloadPdf = async (docType: DocumentType) => {
    if (!hasAccess) {
      setError(accessMessage);
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/documents/${docType.toLowerCase()}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType.toLowerCase()}-${jobId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Job Documents</h2>
            <OvisBadge variant="inline" size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Generate professional documents for this job. All documents must be reviewed and confirmed before use.
            </p>
            {featureFlags.DOC_ENGINE_V1 && (
              <button
                onClick={() => setDocGeneratorOpen(true)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium underline"
              >
                Generate Document →
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENTS.map((doc) => {
              const status = documentStatuses[doc.type];
              const hasContent = status.hasContent;
              const isConfirmed = status.confirmed;

              return (
                <div key={doc.type} className="relative">
                  <div className={`w-full p-4 border rounded-lg transition-colors ${
                    isConfirmed
                      ? "border-emerald-200 bg-emerald-50"
                      : hasContent
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200"
                  }`}>
                    <button
                      onClick={() => {
                        // If DOC_ENGINE_V1 is enabled, always use new editor (it will load draft or generate)
                        if (featureFlags.DOC_ENGINE_V1) {
                          const mappedDocType = mapToDocType(doc.type);
                          setDocEditorType(mappedDocType);
                          setDocEditorOpen(true);
                        } else if (hasContent) {
                          handleOpenEditor(doc.type);
                        } else {
                          handleGenerate(doc);
                        }
                      }}
                      disabled={generatingDoc !== null}
                      className="w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isConfirmed ? "bg-emerald-100" : hasContent ? "bg-amber-100" : "bg-amber-100"
                        }`}>
                          {generatingDoc === doc.type ? (
                            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                          ) : (
                            <FileText className={`w-5 h-5 ${isConfirmed ? "text-emerald-600" : "text-amber-600"}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-slate-900">{doc.label}</h3>
                            {isConfirmed && (
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                            {hasContent && !isConfirmed && (
                              <span className="text-xs text-amber-600 font-medium">Draft</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{doc.description}</p>
                          {hasContent && !isConfirmed && (
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              Review & confirm required
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Action buttons - only show if document has content */}
                    {hasContent && (
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDocument(doc.type);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded transition-colors border border-slate-300"
                          title="Copy to clipboard"
                        >
                          {copiedDoc === doc.type ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailDocument(doc.type);
                          }}
                          disabled={!hasAccess || !clientEmail}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded transition-colors border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!hasAccess ? accessMessage : !clientEmail ? "Client email not set" : "Email to client"}
                        >
                          {!hasAccess ? (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Email
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPdf(doc.type);
                          }}
                          disabled={!hasAccess}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded transition-colors border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!hasAccess ? accessMessage : "Download PDF"}
                        >
                          {!hasAccess ? (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              PDF
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 mr-1" />
                              PDF
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <JobDocumentEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditorContent(null);
          setError(null);
        }}
        title={editorTitle}
        content={editorContent}
        jobId={jobId}
        documentType={editorDocType}
        isConfirmed={editorConfirmed}
        onSave={handleSaveDocument}
        jobTitle={jobTitle}
        tradeType={tradeType}
        address={address}
        clientName={clientName}
        clientEmail={clientEmail}
        hasAccess={hasAccess}
        accessMessage={accessMessage}
      />

      {/* Document Generator Modal - V1 */}
      {featureFlags.DOC_ENGINE_V1 && (
        <DocGeneratorModal
          isOpen={docGeneratorOpen}
          onClose={() => setDocGeneratorOpen(false)}
          jobId={jobId}
          jobData={{
            jobId,
            jobTitle,
            tradeType,
            propertyType: job?.propertyType || "",
            address: address || "",
            clientName: clientName || "",
            clientEmail: job?.clientEmail || "",
            businessName: "",
            abn: "",
            createdAt: job?.createdAt || new Date().toISOString(),
            notes: job?.notes || "",
          }}
        />
      )}
      
      {/* New DocEditor for DOC_ENGINE_V1 */}
      {featureFlags.DOC_ENGINE_V1 && docEditorOpen && docEditorType && (
        <DocEditor
          jobId={jobId}
          docType={docEditorType}
          onClose={() => {
            setDocEditorOpen(false);
            setDocEditorType(null);
            router.refresh(); // Refresh to update document statuses
          }}
          user={user}
          planTier={planTier}
          planStatus={planStatus}
          clientEmail={clientEmail}
          clientName={clientName}
          jobTitle={jobTitle}
          address={address}
        />
      )}
    </>
  );
}

