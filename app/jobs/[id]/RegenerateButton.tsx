"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import type { JobStatus } from "@/lib/jobs";

interface RegenerateButtonProps {
  jobId: string;
  status: JobStatus;
  aiReviewStatus?: "pending" | "confirmed";
  clientStatus?: "draft" | "sent" | "accepted" | "declined" | "cancelled";
}

export default function RegenerateButton({ jobId, status, aiReviewStatus, clientStatus }: RegenerateButtonProps) {
  const router = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");

  const isGenerating = status === "generating" || status === "ai_pending";
  const isConfirmed = aiReviewStatus === "confirmed";
  const isAccepted = clientStatus === "accepted";
  const canRegenerate = !isGenerating && !isRegenerating && !isConfirmed && !isAccepted;

  const handleRegenerate = async () => {
    if (!canRegenerate) {
      if (isAccepted) {
        setError("This pack has been signed by the client. Create a variation instead of regenerating the original scope.");
      } else if (isConfirmed) {
        setError("Cannot regenerate a confirmed job pack. For major changes, create a new job or duplicate this one.");
      }
      return;
    }

    setError("");
    setIsRegenerating(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/regenerate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to regenerate");
        setIsRegenerating(false);
        return;
      }

      // Reset loading state before refresh so button doesn't appear stuck
      setIsRegenerating(false);
      // Refresh the page to show updated content
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRegenerate}
        disabled={!canRegenerate}
        className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRegenerating || isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Regenerating...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Regenerate job pack</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

