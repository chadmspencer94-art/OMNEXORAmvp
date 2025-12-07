"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, FileText } from "lucide-react";
import ClientSignatureModal from "./ClientSignatureModal";
import { calculateEstimateRange } from "@/lib/pricing";

interface ClientQuoteReviewProps {
  jobId: string;
  jobTitle: string;
  address?: string;
  aiSummary?: string;
  aiQuote?: string;
  aiScopeOfWork?: string;
  aiInclusions?: string;
  aiExclusions?: string;
  aiClientNotes?: string;
}

interface SignatureStatus {
  id: string;
  signedName: string;
  signedAt: string;
  docType: string;
  hasSignatureImage: boolean;
}

export default function ClientQuoteReview({
  jobId,
  jobTitle,
  address,
  aiSummary,
  aiQuote,
  aiScopeOfWork,
  aiInclusions,
  aiExclusions,
  aiClientNotes,
}: ClientQuoteReviewProps) {
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);

  // Load signature status
  useEffect(() => {
    async function loadSignature() {
      try {
        const response = await fetch(`/api/jobs/${jobId}/sign-document?docType=QUOTE`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.signature) {
            setSignatureStatus(data.signature);
          }
        }
      } catch (error) {
        console.error("Failed to load signature status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSignature();
  }, [jobId]);

  const handleSignSuccess = () => {
    // Reload signature status
    fetch(`/api/jobs/${jobId}/sign-document?docType=QUOTE`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.signature) {
          setSignatureStatus(data.signature);
        }
      })
      .catch(console.error);
  };

  // Calculate estimate range for display
  const estimateRange = aiQuote ? calculateEstimateRange(aiQuote) : null;

  // Build document summary for modal
  const documentSummary = `Job: ${jobTitle}
${address ? `Location: ${address}\n` : ""}
${estimateRange ? `Total Estimate: ${estimateRange.formattedRange}\n` : ""}
${aiSummary ? `\nSummary:\n${aiSummary}` : ""}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Review & Accept Quote</h2>
          <p className="text-sm text-slate-600 mt-1">Review the quote details below</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Quote Summary */}
          {aiSummary && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Summary</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{aiSummary}</p>
            </div>
          )}

          {/* Pricing */}
          {estimateRange && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-medium text-amber-900 mb-2">Total Estimate</h3>
              <p className="text-2xl font-bold text-amber-900">{estimateRange.formattedRange}</p>
            </div>
          )}

          {/* Scope of Work */}
          {aiScopeOfWork && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Scope of Work</h3>
              <div className="text-slate-700 whitespace-pre-wrap">{aiScopeOfWork}</div>
            </div>
          )}

          {/* Inclusions */}
          {aiInclusions && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Inclusions</h3>
              <ul className="space-y-1">
                {aiInclusions.split("\n").filter((line) => line.trim()).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exclusions */}
          {aiExclusions && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Exclusions</h3>
              <ul className="space-y-1">
                {aiExclusions.split("\n").filter((line) => line.trim()).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-red-400 mr-1">×</span>
                    <span>{item.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Client Notes */}
          {aiClientNotes && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Notes</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{aiClientNotes}</p>
            </div>
          )}

          {/* Signature Status */}
          <div className="pt-6 border-t border-slate-200">
            {signatureStatus ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 mb-1">Quote Accepted & Signed</p>
                    <p className="text-sm text-green-700">
                      Signed by: {signatureStatus.signedName}
                    </p>
                    <p className="text-sm text-green-700">
                      Signed on: {new Date(signatureStatus.signedAt).toLocaleString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-4">
                    Please review the quote above. If you agree with the terms, click below to accept and sign.
                  </p>
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Accept & Sign Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientSignatureModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSuccess={handleSignSuccess}
        jobId={jobId}
        docType="QUOTE"
        docKey={null}
        documentTitle="Job Quote"
        documentSummary={documentSummary}
      />
    </>
  );
}

