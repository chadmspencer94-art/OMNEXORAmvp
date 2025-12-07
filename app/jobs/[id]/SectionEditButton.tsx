"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SectionEditButtonProps {
  jobId: string;
  sectionName: string;
  fieldName: "aiScopeOfWork" | "aiInclusions" | "aiExclusions" | "aiClientNotes" | "aiSummary";
  currentValue?: string | null;
  placeholder?: string;
  label: string;
}

/**
 * Reusable component for editing job pack sections
 * Provides a consistent edit/save pattern for all sections
 */
export default function SectionEditButton({
  jobId,
  sectionName,
  fieldName,
  currentValue,
  placeholder = "",
  label,
}: SectionEditButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(currentValue || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`/api/jobs/${jobId}/pack-sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: value.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save changes");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1000);
    } catch {
      setError("An unexpected error occurred");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue || "");
    setError("");
    setSuccess(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
        title={`Edit ${label}`}
      >
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Edit {label}
              </h3>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {label}
                </label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  rows={12}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm font-mono"
                  disabled={isSaving}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Make any adjustments to this section. Changes will be saved immediately and won&apos;t trigger AI regeneration.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Changes saved successfully!
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

