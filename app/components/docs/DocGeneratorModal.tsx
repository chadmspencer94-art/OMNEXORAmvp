"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { loadTemplate } from "@/lib/docEngine/loadTemplate";
import { generateRenderModel } from "@/lib/docEngine/renderModel";
import type { DocType, JobData } from "@/lib/docEngine/types";
import DocPreview from "./DocPreview";
import DocOvisPanel from "./DocOvisPanel";
import DocExportButton from "./DocExportButton";

interface DocGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobData: JobData;
}

const DOC_TYPES: Array<{ value: DocType; label: string; description: string }> = [
  {
    value: "SWMS",
    label: "SWMS (AU-WA)",
    description: "Safe Work Method Statement aligned with WA WorkSafe guidance",
  },
  {
    value: "PAYMENT_CLAIM_WA",
    label: "Payment Claim (AU-WA)",
    description: "Security of Payment claim aligned with WA Construction Contracts Act 2004",
  },
  {
    value: "TOOLBOX_TALK",
    label: "Toolbox Talk (AU)",
    description: "Safety briefing template following best practice structure",
  },
  {
    value: "VARIATION_CHANGE_ORDER",
    label: "Variation / Change Order (AU)",
    description: "Variation or change order document for contract modifications",
  },
  {
    value: "EXTENSION_OF_TIME",
    label: "Extension of Time (AU)",
    description: "Extension of time request for project delays",
  },
  {
    value: "PROGRESS_CLAIM_TAX_INVOICE",
    label: "Progress Claim / Tax Invoice (AU)",
    description: "Progress claim and tax invoice for payment",
  },
  {
    value: "HANDOVER_PRACTICAL_COMPLETION",
    label: "Handover & Practical Completion (AU)",
    description: "Handover document and practical completion certificate",
  },
  {
    value: "MAINTENANCE_CARE_GUIDE",
    label: "Maintenance & Care Guide (AU)",
    description: "Maintenance and care guide for completed work",
  },
];

export default function DocGeneratorModal({
  isOpen,
  onClose,
  jobId,
  jobData,
}: DocGeneratorModalProps) {
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);
  const [renderModel, setRenderModel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDocType(null);
      setRenderModel(null);
      setError(null);
      // Check email verification status
      checkEmailVerification();
    }
  }, [isOpen]);

  const checkEmailVerification = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setEmailVerified(!!data.user?.emailVerifiedAt);
      } else {
        setEmailVerified(false);
      }
    } catch {
      setEmailVerified(false);
    }
  };

  const handleSelectDocType = (docType: DocType) => {
    try {
      setIsGenerating(true);
      setError(null);

      const template = loadTemplate(docType);
      const model = generateRenderModel(template, jobData);
      setRenderModel(model);
      setSelectedDocType(docType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate document");
      console.error("Document generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModelChange = (updatedModel: any) => {
    setRenderModel(updatedModel);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900">Generate Document</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {!selectedDocType ? (
              // Document type selection
              <div className="space-y-4">
                {emailVerified === false && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-amber-900 mb-1">Email Verification Required</h3>
                        <p className="text-sm text-amber-800 mb-3">
                          Please verify your email address to generate documents. Check your inbox for a verification email or{" "}
                          <Link href="/settings" className="underline font-medium">
                            resend verification email
                          </Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-slate-600 mb-6">
                  Select a document type to generate. All documents are compliance-ready templates (AU/WA) and require review before use.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DOC_TYPES.map((doc) => (
                    <button
                      key={doc.value}
                      onClick={() => handleSelectDocType(doc.value)}
                      disabled={isGenerating || emailVerified === false}
                      className="text-left p-4 border border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <h3 className="font-semibold text-slate-900 mb-1">{doc.label}</h3>
                      <p className="text-sm text-slate-600">{doc.description}</p>
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              // Document preview
              <div className="space-y-6">
                {/* OVIS Panel */}
                {renderModel && <DocOvisPanel model={renderModel} />}

                {/* Document Preview - Editable */}
                {renderModel && (
                  <DocPreview
                    model={renderModel}
                    editable={true}
                    onModelChange={handleModelChange}
                  />
                )}

                {/* Export Button */}
                {renderModel && (
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <DocExportButton
                      jobId={jobId}
                      docType={selectedDocType!}
                      recordId={renderModel.recordId}
                      renderModel={renderModel}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Review required before use. Not certified or verified.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

