"use client";

import { useState } from "react";
import { Loader2, FileText, AlertCircle } from "lucide-react";
import JobDocumentModal, { type JobDocumentType } from "./JobDocumentModal";

interface JobDocumentsSectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  clientName?: string;
  showWarning?: boolean;
}

const DOCUMENT_TYPES: Array<{
  type: JobDocumentType;
  label: string;
  description: string;
  endpoint: string;
}> = [
  {
    type: "SWMS",
    label: "SWMS",
    description: "Safe Work Method Statement",
    endpoint: "swms",
  },
  {
    type: "VARIATION",
    label: "Variation",
    description: "Change Order / Variation",
    endpoint: "variation",
  },
  {
    type: "EOT",
    label: "Extension of Time",
    description: "EOT Notice",
    endpoint: "eot",
  },
  {
    type: "PROGRESS_CLAIM",
    label: "Progress Claim",
    description: "Tax Invoice / Progress Claim",
    endpoint: "progress-claim",
  },
  {
    type: "HANDOVER",
    label: "Handover Checklist",
    description: "Practical Completion",
    endpoint: "handover",
  },
  {
    type: "MAINTENANCE",
    label: "Maintenance Guide",
    description: "Care & Maintenance Guide",
    endpoint: "maintenance",
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
  const [generatingDoc, setGeneratingDoc] = useState<JobDocumentType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<{
    type: JobDocumentType;
    title: string;
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (docType: JobDocumentType, endpoint: string) => {
    setGeneratingDoc(docType);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/${endpoint}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to generate ${docType}`);
      }

      const data = await response.json();
      if (data.success && data.body) {
        setCurrentDoc({
          type: docType,
          title: data.title || `${docType} - ${jobTitle}`,
          text: data.body,
        });
        setModalOpen(true);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${docType}`);
    } finally {
      setGeneratingDoc(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Job Documents</h2>
              <p className="text-xs text-slate-500 mt-1">
                Generate professional documents for this job
              </p>
            </div>
          </div>
        </div>

        {showWarning && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                ⚠ This job has already been sent to the client. Use Variations, EOTs and new documents to record changes – don&apos;t overwrite the original quote.
              </p>
            </div>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENT_TYPES.map((doc) => (
              <button
                key={doc.type}
                onClick={() => handleGenerate(doc.type, doc.endpoint)}
                disabled={generatingDoc !== null}
                className="p-4 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm mb-1">
                      {doc.label}
                    </h3>
                    <p className="text-xs text-slate-500">{doc.description}</p>
                    {generatingDoc === doc.type && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentDoc && (
        <JobDocumentModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setCurrentDoc(null);
          }}
          documentType={currentDoc.type}
          documentTitle={currentDoc.title}
          documentText={currentDoc.text}
          jobId={jobId}
          jobTitle={jobTitle}
          tradeType={tradeType}
          address={address}
          clientName={clientName}
          showWarning={showWarning}
        />
      )}
    </>
  );
}

