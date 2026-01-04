"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, FileText, XCircle } from "lucide-react";
import QuoteAcceptanceModal from "./QuoteAcceptanceModal";
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
  clientStatus?: string;
  clientAcceptedAt?: string | null;
  clientDeclinedAt?: string | null;
  clientSignedName?: string | null;
  clientSignedEmail?: string | null;
  userEmail: string;
  tradieVerificationStatus?: string | null;
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
  clientStatus,
  clientAcceptedAt,
  clientDeclinedAt,
  clientSignedName,
  clientSignedEmail,
  userEmail,
  tradieVerificationStatus,
}: ClientQuoteReviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState("");

  const handleAcceptSuccess = () => {
    // Reload the page to show updated status
    window.location.reload();
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to decline quote.");
      }

      // Reload the page to show updated status
      window.location.reload();
    } catch (err: any) {
      console.error("Error declining quote:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsDeclining(false);
    }
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

  const isTradieVerified = tradieVerificationStatus === "verified";

  return (
    <>
      {/* Structured Badge for Client View */}
      {isTradieVerified && (
        <div className="mb-4 flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-300">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Structured by OMNEXORA</span>
          </div>
        </div>
      )}

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

          {/* Acceptance/Decline Actions */}
          <div className="pt-6 border-t border-slate-200">
            {clientStatus === "accepted" && clientAcceptedAt ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 mb-1">Quote Accepted & Signed</p>
                    {clientSignedName && (
                      <p className="text-sm text-green-700">
                        Signed by: {clientSignedName}
                      </p>
                    )}
                    {clientSignedEmail && (
                      <p className="text-sm text-green-700">
                        Email: {clientSignedEmail}
                      </p>
                    )}
                    <p className="text-sm text-green-700">
                      Accepted on: {new Date(clientAcceptedAt).toLocaleString("en-AU", {
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
            ) : clientStatus === "declined" && clientDeclinedAt ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 mb-1">Quote Declined</p>
                    <p className="text-sm text-red-700">
                      Declined on: {new Date(clientDeclinedAt).toLocaleString("en-AU", {
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
            ) : (clientStatus === "sent" || clientStatus === "draft") ? (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-4">
                    Please review the quote above. If you agree with the terms, click below to accept and sign.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowAcceptModal(true)}
                      className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Accept & Sign Quote
                    </button>
                    <button
                      onClick={() => setShowDeclineConfirm(true)}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      disabled={isDeclining}
                    >
                      <XCircle className="w-5 h-5" />
                      Decline Quote
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      <QuoteAcceptanceModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onSuccess={handleAcceptSuccess}
        jobId={jobId}
        userEmail={userEmail}
      />

      {/* Decline Confirmation Modal */}
      {showDeclineConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-75 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">Decline Quote?</h3>
            <p className="mb-6 text-slate-600">
              Are you sure you want to decline this quote? This action cannot be undone.
            </p>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeclineConfirm(false);
                  setError("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                disabled={isDeclining}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="inline-flex items-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeclining}
              >
                {isDeclining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Declining...
                  </>
                ) : (
                  "Yes, Decline Quote"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

