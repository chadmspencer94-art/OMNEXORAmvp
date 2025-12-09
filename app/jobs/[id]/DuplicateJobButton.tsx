"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

interface DuplicateJobButtonProps {
  jobId: string;
}

export default function DuplicateJobButton({ jobId }: DuplicateJobButtonProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState("");

  const handleDuplicate = async () => {
    // Optional: confirm with user
    const confirmed = window.confirm(
      "Create a copy of this job and its job pack?\n\nThe new job will have the same details but will be reset to draft status."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to duplicate job");
        setIsDuplicating(false);
        return;
      }

      const data = await response.json();

      // Navigate to the new job's detail page
      router.push(`/jobs/${data.jobId}`);
      
      // Show a brief success message (the navigation will happen immediately)
      // The user will see the new job page
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDuplicating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDuplicate}
        disabled={isDuplicating}
        className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDuplicating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Duplicating...</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            <span>Duplicate Job</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

