"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AIReviewStatus } from "@/lib/jobs";

interface AIReviewStatusControlProps {
  jobId: string;
  currentStatus: AIReviewStatus;
}

export default function AIReviewStatusControl({ jobId, currentStatus }: AIReviewStatusControlProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiReviewStatus: "confirmed" }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update status");
        setIsUpdating(false);
        return;
      }

      // Reset loading state before refresh so button doesn't appear stuck
      setIsUpdating(false);
      router.refresh();
    } catch {
      setError("Failed to update status");
      setIsUpdating(false);
    }
  };

  if (currentStatus === "confirmed") {
    return (
      <button
        disabled
        className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded cursor-default"
      >
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          AI pack confirmed
        </span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleConfirm}
        disabled={isUpdating}
        className="text-xs text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
      >
        {isUpdating ? "Confirming..." : "Mark AI pack as confirmed"}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

