"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Check, AlertTriangle } from "lucide-react";
import AIWarningBanner from "@/app/components/AIWarningBanner";
import { updateClientDetails } from "./actions";

interface ClientDetailsEntryProps {
  jobId: string;
  currentClientName?: string | null;
  currentClientEmail?: string | null;
  planTier?: string;
}

export default function ClientDetailsEntry({
  jobId,
  currentClientName,
  currentClientEmail,
  planTier = "FREE",
}: ClientDetailsEntryProps) {
  const router = useRouter();
  const [clientName, setClientName] = useState(currentClientName || "");
  const [clientEmail, setClientEmail] = useState(currentClientEmail || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  // Sync state with props when they change (e.g., after page refresh)
  // Only update if props are valid strings (not null/undefined/NaN)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional prop sync pattern
  useEffect(() => {
    if (typeof currentClientName === "string") {
      setClientName(currentClientName);
    } else if (currentClientName === null || currentClientName === undefined) {
      setClientName("");
    }
    
    if (typeof currentClientEmail === "string") {
      setClientEmail(currentClientEmail);
    } else if (currentClientEmail === null || currentClientEmail === undefined) {
      setClientEmail("");
    }
  }, [currentClientName, currentClientEmail]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Client-side validation
    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }

    if (!clientEmail.trim()) {
      setError("Client email is required");
      return;
    }

    if (!validateEmail(clientEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!reviewConfirmed) {
      setError("Please confirm that you have reviewed and verified the AI-generated content");
      return;
    }

    // Validate inputs before calling Server Action
    const trimmedName = clientName?.trim() || "";
    const trimmedEmail = clientEmail?.trim().toLowerCase() || "";
    
    if (!trimmedName || !trimmedEmail) {
      setError("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateClientDetails(
          jobId,
          trimmedName,
          trimmedEmail
        );

        if (result && result.ok === true) {
          setSuccess(true);
          setError("");
          setTimeout(() => setSuccess(false), 3000);
          // Refresh the page to show updated details
          router.refresh();
        } else {
          // Show the actual error message from the server
          const errorMessage = result?.message || "Failed to save client details";
          setError(errorMessage);
          setSuccess(false);
        }
      } catch (err) {
        console.error("[ClientDetailsEntry] Error calling updateClientDetails:", err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        setSuccess(false);
      }
    });
  };

  const hasChanges = 
    clientName !== (currentClientName || "") || 
    clientEmail !== (currentClientEmail || "");

  const hasPaidPlan = planTier !== "FREE";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Enter Client Details
        </h2>
        <p className="text-sm text-slate-600">
          Client information is kept private and never sent to AI systems. Enter client details manually after reviewing the AI-generated job pack.
        </p>
      </div>

      {/* Free Plan Warning Banner - Only show for non-admins */}
      {!hasPaidPlan && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">
                Free Plan Limitations
              </p>
              <p className="text-sm text-amber-800">
                You can generate job packs for free, but a paid membership is required to save client details and send job packs to clients. Upgrade your plan to unlock these features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Warning Banner */}
      <div className="mb-6">
        <AIWarningBanner variant="compact" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Client details saved successfully</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 mb-2">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-700 mb-2">
              Client Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="clientEmail"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              required
              disabled={isPending}
            />
          </div>
        </div>

        {/* Review Confirmation */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewConfirmed}
              onChange={(e) => setReviewConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 flex-shrink-0"
              disabled={isPending}
            />
            <span className="text-sm text-amber-900">
              <span className="font-semibold">I confirm:</span> I have reviewed and verified all AI-generated content in this job pack and ensured its accuracy and compliance with all applicable Australian laws and regulations before saving client details.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
            <button
            type="submit"
            disabled={isPending || !hasChanges || !reviewConfirmed}
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Client Details
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

