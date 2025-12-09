"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, PenTool } from "lucide-react";
import type { ClientStatus } from "@/lib/jobs";

interface ClientAcceptanceFormProps {
  jobId: string;
  currentStatus: ClientStatus;
  clientEmail: string;
  quoteExpiryAt?: string | null;
  quoteNumber?: string | null;
  quoteVersion?: number | null;
  clientAcceptedAt?: string | null;
  clientAcceptedByName?: string | null;
  clientAcceptanceNote?: string | null;
  clientAcceptedQuoteVer?: number | null;
}

export default function ClientAcceptanceForm({
  jobId,
  currentStatus,
  clientEmail,
  quoteExpiryAt,
  quoteNumber,
  quoteVersion,
  clientAcceptedAt,
  clientAcceptedByName,
  clientAcceptanceNote,
  clientAcceptedQuoteVer,
}: ClientAcceptanceFormProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [acceptanceNote, setAcceptanceNote] = useState("");
  const [confirmAgreement, setConfirmAgreement] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canAcceptOrDecline = currentStatus === "sent" || currentStatus === "draft";
  const isExpired = quoteExpiryAt ? new Date(quoteExpiryAt) < new Date() : false;
  const canAccept = canAcceptOrDecline && !isExpired;

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setError("");
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/client/jobs/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          note: acceptanceNote.trim() || undefined,
          confirm: confirmAgreement,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (data.error === "QUOTE_EXPIRED") {
          throw new Error(data.message || "This quote has expired. Please contact your tradie to get an updated job pack.");
        }
        if (data.error === "QUOTE_DECLINED") {
          throw new Error(data.message || "This job pack was declined; contact your tradie for a new quote.");
        }
        throw new Error(data.error || data.message || "Failed to accept job pack");
      }

      setSuccess("Thanks – your approval has been recorded.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to accept job pack");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsDeclining(true);

    try {
      const response = await fetch(`/api/client/jobs/${jobId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: declineReason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to decline job pack");
      }

      setSuccess("Your decline has been recorded. Your tradie will be notified.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to decline job pack");
    } finally {
      setIsDeclining(false);
      setShowDeclineForm(false);
    }
  };

  if (currentStatus === "accepted") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">Job Pack Accepted</h3>
            <div className="space-y-2 text-sm text-emerald-700">
              {clientAcceptedAt && (
                <p>
                  <span className="font-medium">Accepted on:</span>{" "}
                  {new Date(clientAcceptedAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {clientAcceptedByName && (
                <p>
                  <span className="font-medium">Accepted by:</span> {clientAcceptedByName}
                </p>
              )}
              {quoteNumber && clientAcceptedQuoteVer && (
                <p>
                  <span className="font-medium">Quote:</span> {quoteNumber} v{clientAcceptedQuoteVer}
                </p>
              )}
              {clientAcceptanceNote && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="font-medium mb-1">Your note:</p>
                  <p className="text-emerald-600 whitespace-pre-wrap">{clientAcceptanceNote}</p>
                </div>
              )}
              <p className="mt-3 text-emerald-600">
                Your tradie has been notified and can proceed with the work.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "declined") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-rose-900 mb-2">Quote Declined</h3>
            <p className="text-rose-700 text-sm mb-3">
              You have declined this job pack. If you have questions or would like to discuss alternatives, please contact your tradie.
            </p>
            {jobId && (
              <a
                href={`mailto:?subject=Re: Job Pack ${jobId}`}
                className="text-sm text-rose-700 underline hover:text-rose-900"
              >
                Contact your tradie →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!canAcceptOrDecline) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Approve This Job Pack</h2>
      
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!showDeclineForm ? (
        <>
          {isExpired && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-1">
                This quote has expired
              </p>
              <p className="text-sm text-red-600">
                Please contact your tradie to get an updated job pack.
              </p>
            </div>
          )}

          <p className="text-slate-600 mb-6 text-sm">
            If you&apos;re happy with this job pack and estimate, you can approve it below so your tradie can lock in the job.
          </p>

          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isAccepting || isDeclining || !canAccept}
              />
              <p className="mt-1 text-xs text-slate-500">
                This will be recorded as your digital signature.
              </p>
            </div>

            <div>
              <label htmlFor="acceptanceNote" className="block text-sm font-medium text-slate-700 mb-2">
                Notes <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                id="acceptanceNote"
                value={acceptanceNote}
                onChange={(e) => setAcceptanceNote(e.target.value)}
                placeholder="Any additional notes or comments..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y"
                disabled={isAccepting || isDeclining || !canAccept}
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="confirmAgreement"
                checked={confirmAgreement}
                onChange={(e) => setConfirmAgreement(e.target.checked)}
                disabled={isAccepting || isDeclining || !canAccept}
                className="mt-1 w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                required
              />
              <label htmlFor="confirmAgreement" className="text-sm text-slate-700 flex-1">
                I confirm I have read and agree to this job pack and authorise the tradie to proceed on this basis.
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isAccepting || isDeclining || !fullName.trim() || !confirmAgreement || !canAccept}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isExpired ? "This quote has expired. Please contact your tradie for an updated job pack." : undefined}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Job Pack
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDeclineForm(true)}
                disabled={isAccepting || isDeclining}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </form>
        </>
      ) : (
        <form onSubmit={handleDecline} className="space-y-4">
          <div>
            <label htmlFor="declineReason" className="block text-sm font-medium text-slate-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              id="declineReason"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Let your tradie know why you're declining..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              disabled={isDeclining}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isDeclining}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeclining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Decline
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowDeclineForm(false);
                setDeclineReason("");
                setError("");
              }}
              disabled={isDeclining}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

