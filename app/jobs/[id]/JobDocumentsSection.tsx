"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, FileText, Check, Copy, Download, Mail, Lock, 
  ChevronDown, ChevronUp, X, Sparkles
} from "lucide-react";
import JobDocumentEditor from "./JobDocumentEditor";
import OvisBadge from "@/app/components/OvisBadge";
import DocGeneratorModal from "@/app/components/docs/DocGeneratorModal";
import DocEditor from "@/app/components/docs/DocEditor";
import { featureFlags } from "@/lib/featureFlags";
import { hasDocumentFeatureAccess, getDocumentAccessMessage } from "@/lib/documentAccess";
import type { Job } from "@/lib/jobs";
import type { DocType } from "@/lib/docEngine/types";
import type { SafeUser } from "@/lib/auth";

interface JobDocumentsSectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  clientName?: string;
  clientEmail?: string;
  showWarning?: boolean;
  job?: Job;
  user?: SafeUser | null;
  planTier?: string;
  planStatus?: string;
}

type DocumentType = "SWMS" | "VARIATION" | "EOT" | "PROGRESS_CLAIM" | "HANDOVER" | "MAINTENANCE";

interface DocumentConfig {
  type: DocumentType;
  label: string;
  shortLabel: string;
  apiPath: string;
  description: string;
}

const DOCUMENTS: DocumentConfig[] = [
  {
    type: "VARIATION",
    label: "Variation / Change Order",
    shortLabel: "Variation",
    apiPath: "variation",
    description: "Use when scope or price changes",
  },
  {
    type: "EOT",
    label: "Extension of Time (EOT)",
    shortLabel: "EOT",
    apiPath: "eot",
    description: "Request additional time",
  },
  {
    type: "PROGRESS_CLAIM",
    label: "Progress Claim / Tax Invoice",
    shortLabel: "Progress Claim",
    apiPath: "progress-claim",
    description: "Invoice for completed work",
  },
  {
    type: "HANDOVER",
    label: "Handover & Practical Completion",
    shortLabel: "Handover",
    apiPath: "handover",
    description: "Document final completion",
  },
  {
    type: "MAINTENANCE",
    label: "Maintenance & Care Guide",
    shortLabel: "Maintenance",
    apiPath: "maintenance",
    description: "Care instructions",
  },
];

const DOCUMENT_STATUS_FIELDS: Record<DocumentType, { textField: keyof Job; confirmedField: keyof Job }> = {
  SWMS: { textField: "swmsText", confirmedField: "swmsConfirmed" },
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentConfig | null>(null);
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
    SWMS: { hasContent: false, confirmed: false },
    VARIATION: { hasContent: false, confirmed: false },
    EOT: { hasContent: false, confirmed: false },
    PROGRESS_CLAIM: { hasContent: false, confirmed: false },
    HANDOVER: { hasContent: false, confirmed: false },
    MAINTENANCE: { hasContent: false, confirmed: false },
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasAccess = hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: user?.isAdmin ?? false });
  const accessMessage = getDocumentAccessMessage(user, { planTier, planStatus, isAdmin: user?.isAdmin ?? false });

  // Load document statuses from job
  useEffect(() => {
    if (job) {
      const statuses: Record<DocumentType, { hasContent: boolean; confirmed: boolean }> = {
        SWMS: { hasContent: !!job.swmsText, confirmed: !!job.swmsConfirmed },
        VARIATION: { hasContent: !!job.variationText, confirmed: !!job.variationConfirmed },
        EOT: { hasContent: !!job.eotText, confirmed: !!job.eotConfirmed },
        PROGRESS_CLAIM: { hasContent: !!job.progressClaimText, confirmed: !!job.progressClaimConfirmed },
        HANDOVER: { hasContent: !!job.handoverText, confirmed: !!job.handoverConfirmed },
        MAINTENANCE: { hasContent: !!job.maintenanceText, confirmed: !!job.maintenanceConfirmed },
      };
      setDocumentStatuses(statuses);
    }
  }, [job]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async (doc: DocumentConfig) => {
    setGeneratingDoc(doc.type);
    setError(null);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/jobs/${jobId}/${doc.apiPath}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to generate ${doc.label}`);
      }

      const data = await response.json();
      
      let content = "";
      let title = doc.label;
      
      if (data.success) {
        if (data.swms) {
          content = data.swms;
        } else if (data.body) {
          content = data.body;
          title = data.title || doc.label;
        } else if (data.document) {
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
        await fetch(`/api/jobs/${jobId}/documents/${doc.type.toLowerCase()}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim(), confirmed: false }),
        });
      } catch (saveErr) {
        console.warn("Error saving document draft:", saveErr);
      }

      setEditorContent(content);
      setEditorTitle(title);
      setEditorDocType(doc.type);
      setEditorConfirmed(false);
      setEditorOpen(true);
      setSelectedDoc(doc);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to generate ${doc.label}`;
      setError(errorMessage);
    } finally {
      setGeneratingDoc(null);
    }
  };

  const mapToDocType = (docType: DocumentType): DocType => {
    const mapping: Record<DocumentType, DocType> = {
      VARIATION: "VARIATION_CHANGE_ORDER",
      EOT: "EXTENSION_OF_TIME",
      PROGRESS_CLAIM: "PROGRESS_CLAIM_TAX_INVOICE",
      HANDOVER: "HANDOVER_PRACTICAL_COMPLETION",
      MAINTENANCE: "MAINTENANCE_CARE_GUIDE",
      SWMS: "SWMS",
    };
    return mapping[docType];
  };

  const handleSelectDocument = async (doc: DocumentConfig) => {
    setSelectedDoc(doc);
    setIsOpen(false);
    
    const status = documentStatuses[doc.type];
    
    if (featureFlags.DOC_ENGINE_V1) {
      const mappedDocType = mapToDocType(doc.type);
      setDocEditorType(mappedDocType);
      setDocEditorOpen(true);
    } else if (status.hasContent) {
      // Open existing document
      try {
        const response = await fetch(`/api/jobs/${jobId}/documents/${doc.type.toLowerCase()}`);
        if (response.ok) {
          const data = await response.json();
          setEditorContent(data.content || "");
          setEditorConfirmed(data.confirmed || false);
          setEditorTitle(doc.label);
          setEditorDocType(doc.type);
          setEditorOpen(true);
        } else {
          setError("Failed to load document");
        }
      } catch (err) {
        setError("Failed to load document");
      }
    } else {
      // Generate new document
      handleGenerate(doc);
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

    setDocumentStatuses((prev) => ({
      ...prev,
      [editorDocType]: { hasContent: true, confirmed },
    }));

    router.refresh();
  };

  const handleCopyDocument = async (docType: DocumentType) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/documents/${docType.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.content || "");
        setCopiedDoc(docType);
        setTimeout(() => setCopiedDoc(null), 2000);
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
        const docLabel = DOCUMENTS.find((d) => d.type === docType)?.label || docType;
        const subject = `${docLabel} - ${jobTitle}`;
        const body = `Hi ${clientName || "there"},\n\nPlease find attached the ${docLabel.toLowerCase()} for:\n\nJob: ${jobTitle}\n${address ? `Address: ${address}\n` : ""}\n---\n\n${data.content || ""}\n\n---\n\nKind regards`;
        window.location.href = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

  // Count generated documents
  const generatedCount = Object.values(documentStatuses).filter(s => s.hasContent).length;
  const confirmedCount = Object.values(documentStatuses).filter(s => s.confirmed).length;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Job Documents</h3>
                  <OvisBadge variant="inline" size="sm" />
                </div>
                <p className="text-xs text-slate-500">
                  {generatedCount > 0 ? (
                    <span>{generatedCount} generated{confirmedCount > 0 && `, ${confirmedCount} confirmed`}</span>
                  ) : (
                    "Generate professional documents"
                  )}
                </p>
              </div>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={generatingDoc !== null}
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {generatingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Documents
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-500 font-medium">Select a document to generate or edit</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {DOCUMENTS.map((doc) => {
                      const status = documentStatuses[doc.type];
                      return (
                        <button
                          key={doc.type}
                          onClick={() => handleSelectDocument(doc)}
                          className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            status.confirmed ? "bg-emerald-100" : status.hasContent ? "bg-amber-100" : "bg-slate-100"
                          }`}>
                            <FileText className={`w-4 h-4 ${
                              status.confirmed ? "text-emerald-600" : status.hasContent ? "text-amber-600" : "text-slate-400"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{doc.shortLabel}</span>
                              {status.confirmed && <Check className="w-3 h-3 text-emerald-600" />}
                              {status.hasContent && !status.confirmed && (
                                <span className="text-xs text-amber-600 font-medium">Draft</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{doc.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <p className="text-xs text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Quick actions for selected/generated document */}
          {selectedDoc && documentStatuses[selectedDoc.type].hasContent && (
            <div className="mt-3 p-2 bg-slate-50 rounded-lg flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Quick actions for {selectedDoc.shortLabel}:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopyDocument(selectedDoc.type)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200"
                >
                  {copiedDoc === selectedDoc.type ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedDoc === selectedDoc.type ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => handleEmailDocument(selectedDoc.type)}
                  disabled={!hasAccess || !clientEmail}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200 disabled:opacity-50"
                >
                  {!hasAccess ? <Lock className="w-3 h-3 mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                  Email
                </button>
                <button
                  onClick={() => handleDownloadPdf(selectedDoc.type)}
                  disabled={!hasAccess}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200 disabled:opacity-50"
                >
                  {!hasAccess ? <Lock className="w-3 h-3 mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                  PDF
                </button>
              </div>
            </div>
          )}
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
      
      {featureFlags.DOC_ENGINE_V1 && docEditorOpen && docEditorType && (
        <DocEditor
          jobId={jobId}
          docType={docEditorType}
          onClose={() => {
            setDocEditorOpen(false);
            setDocEditorType(null);
            router.refresh();
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
