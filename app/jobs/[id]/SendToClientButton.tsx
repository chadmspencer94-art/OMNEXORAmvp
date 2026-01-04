"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Lock, Loader2, Check } from "lucide-react";

interface SendToClientButtonProps {
  jobId: string;
  clientEmail?: string;
  clientName?: string;
  jobTitle: string;
  sentToClientAt?: string | null;
  verificationStatus?: string;
  planTier?: string;
}

export default function SendToClientButton({
  jobId,
  clientEmail: initialClientEmail,
  clientName,
  jobTitle,
  sentToClientAt: initialSentAt,
  verificationStatus,
  planTier = "FREE",
}: SendToClientButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sentToClientAt, setSentToClientAt] = useState(initialSentAt);

  // Form state
  const [clientEmail, setClientEmail] = useState(initialClientEmail || "");
  const [subject, setSubject] = useState(`Job pack for ${jobTitle}`);
  const [message, setMessage] = useState("");
  const [aiContentConfirmed, setAiContentConfirmed] = useState(false);

  const isVerified = verificationStatus === "verified";
  const hasPaidPlan = planTier !== "FREE";
  const canSend = isVerified && hasPaidPlan;

  const handleOpenModal = () => {
    if (!hasPaidPlan) {
      setError("A paid membership is required to send job packs to clients. Please upgrade your plan to continue.");
      setTimeout(() => setError(""), 8000);
      return;
    }
    
    if (!isVerified) {
      setError("Only structured businesses can send job packs to clients.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Check if client details are entered
    if (!initialClientEmail || !initialClientEmail.trim()) {
      setError("Please enter client details before sending the job pack. Client information must be entered manually after reviewing the AI-generated content.");
      setTimeout(() => setError(""), 8000);
      return;
    }

    setIsModalOpen(true);
    setError("");
    setSuccess(false);
    // Reset email to initial value when opening
    setClientEmail(initialClientEmail || "");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
    setAiContentConfirmed(false); // Reset confirmation when closing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Require AI content confirmation
    if (!aiContentConfirmed) {
      setError("Please confirm that you have reviewed the AI-generated content before sending.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/send-to-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Build a user-friendly error message with details if available
        let errorMsg = data.error || "Failed to send job pack";
        if (data.details) {
          errorMsg = `${errorMsg}\n\nDetails: ${data.details}`;
        }
        setError(errorMsg);
        setIsSending(false);
        return;
      }

      // Success!
      setSentToClientAt(data.sentToClientAt);
      setSuccess(true);
      setIsSending(false);

      // Close modal after a short delay to show success
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch {
      setError("An unexpected error occurred");
      setIsSending(false);
    }
  };

  const formatSentDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Send to Client Button */}
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleOpenModal}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            canSend
              ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          title={canSend ? "Send job pack to client via email" : (!hasPaidPlan ? "Paid plan required" : "Verification required")}
        >
          <Send className="w-4 h-4 mr-2" />
          <span>Send to Client</span>
          {!canSend && (
            <Lock className="w-3 h-3 ml-1.5 text-amber-500" />
          )}
        </button>

        {/* Status text */}
        {sentToClientAt ? (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Last sent {formatSentDate(sentToClientAt)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Not yet sent to client</span>
        )}

        {/* Inline error for non-modal errors */}
        {error && !isModalOpen && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Send Job Pack to Client
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Success State */}
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Job Pack Sent!</h4>
                  <p className="text-slate-600">
                    Email sent to {clientEmail}
                  </p>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 whitespace-pre-wrap">
                      {error}
                    </div>
                  )}

                  {clientName && (
                    <p className="text-sm text-slate-600 mb-4">
                      Sending to: <span className="font-medium text-slate-900">{clientName}</span>
                    </p>
                  )}

                  {/* Client Email */}
                  <div className="mb-4">
                    <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-700 mb-1">
                      Client Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="clientEmail"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                      required
                      disabled={isSending}
                    />
                  </div>

                  {/* Subject */}
                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={`Job pack for ${jobTitle}`}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                      disabled={isSending}
                    />
                  </div>

                  {/* Optional Message */}
                  <div className="mb-4">
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                      Additional Note (optional)
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a personal note to include in the email..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm resize-none"
                      disabled={isSending}
                    />
                  </div>

                  {/* AI Content Confirmation */}
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiContentConfirmed}
                        onChange={(e) => setAiContentConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 flex-shrink-0"
                        disabled={isSending}
                      />
                      <span className="text-sm text-amber-900">
                        <span className="font-semibold">I confirm:</span> I have reviewed all AI-generated content in this job pack and ensured its compliance with all applicable Australian laws and regulations before sending to the client.
                      </span>
                    </label>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isSending}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSending || !clientEmail.trim() || !aiContentConfirmed}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

