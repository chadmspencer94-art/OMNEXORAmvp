"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Check, Edit2 } from "lucide-react";
import JobDocumentEditor from "./JobDocumentEditor";
import type { Job } from "@/lib/jobs";

interface JobDocumentsSectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  clientName?: string;
  showWarning?: boolean;
  job?: Job; // Optional job object to check confirmation status
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
    label: "Variation",
    apiPath: "variation",
    description: "Change Order / Variation",
  },
  {
    type: "EOT",
    label: "Extension of Time",
    apiPath: "eot",
    description: "EOT Notice",
  },
  {
    type: "PROGRESS_CLAIM",
    label: "Progress Claim",
    apiPath: "progress-claim",
    description: "Tax Invoice / Progress Claim",
  },
  {
    type: "HANDOVER",
    label: "Handover Checklist",
    apiPath: "handover",
    description: "Practical Completion",
  },
  {
    type: "MAINTENANCE",
    label: "Maintenance Guide",
    apiPath: "maintenance",
    description: "Care & Maintenance Guide",
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
  showWarning = false,
  job,
}: JobDocumentsSectionProps) {
  const router = useRouter();
  const [generatingDoc, setGeneratingDoc] = useState<DocumentType | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDocType, setEditorDocType] = useState<DocumentType>("SWMS");
  const [editorConfirmed, setEditorConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentStatuses, setDocumentStatuses] = useState<Record<DocumentType, { hasContent: boolean; confirmed: boolean }>>({
    SWMS: { hasContent: false, confirmed: false }, // Kept for type compatibility but not displayed
    VARIATION: { hasContent: false, confirmed: false },
    EOT: { hasContent: false, confirmed: false },
    PROGRESS_CLAIM: { hasContent: false, confirmed: false },
    HANDOVER: { hasContent: false, confirmed: false },
    MAINTENANCE: { hasContent: false, confirmed: false },
  });

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

  const handleOpenEditor = async (docType: DocumentType) => {
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

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Job Documents</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate professional documents for this job. All documents must be reviewed and confirmed before use.
          </p>
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
                  <button
                    onClick={() => {
                      if (hasContent) {
                        handleOpenEditor(doc.type);
                      } else {
                        handleGenerate(doc);
                      }
                    }}
                    disabled={generatingDoc !== null}
                    className={`w-full p-4 border rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                      isConfirmed
                        ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        : hasContent
                        ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                        : "border-slate-200 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
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
      />
    </>
  );
}

