"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteJobButtonProps {
  jobId: string;
}

export default function DeleteJobButton({ jobId }: DeleteJobButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/delete`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to remove job");
        setIsDeleting(false);
        return;
      }

      // Success - redirect to jobs list
      router.push("/jobs?removed=true");
    } catch {
      setError("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span>Remove Job</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Remove this job?
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Are you sure you want to remove this job from your list? You won&apos;t see it in your jobs, but we will keep a record internally.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>{isDeleting ? "Removing..." : "Yes, remove job"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

