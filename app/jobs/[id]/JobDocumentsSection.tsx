"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";
import JobDocumentModal from "./JobDocumentModal";

interface JobDocumentsSectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  clientName?: string;
  showWarning?: boolean;
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
    type: "SWMS",
    label: "SWMS",
    apiPath: "swms",
    description: "Safe Work Method Statement",
  },
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

export default function JobDocumentsSection({
  jobId,
  jobTitle,
  tradeType,
  address,
  clientName,
  showWarning = false,
}: JobDocumentsSectionProps) {
  const router = useRouter();
  const [generatingDoc, setGeneratingDoc] = useState<DocumentType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDocType, setModalDocType] = useState<DocumentType>("SWMS");
  const [error, setError] = useState<string | null>(null);

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

      setModalContent(content);
      setModalTitle(title);
      setModalDocType(doc.type);
      setModalOpen(true);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to generate ${doc.label}`;
      setError(errorMessage);
    } finally {
      setGeneratingDoc(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Job Documents</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate professional documents for this job
          </p>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENTS.map((doc) => (
              <button
                key={doc.type}
                onClick={() => handleGenerate(doc)}
                disabled={generatingDoc !== null}
                className="p-4 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {generatingDoc === doc.type ? (
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 mb-1">{doc.label}</h3>
                    <p className="text-xs text-slate-500">{doc.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <JobDocumentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalContent(null);
          setError(null);
        }}
        title={modalTitle}
        content={modalContent}
        jobId={jobId}
        jobTitle={jobTitle}
        tradeType={tradeType}
        address={address}
        clientName={clientName}
        documentType={modalDocType}
        showWarning={showWarning}
      />
    </>
  );
}

