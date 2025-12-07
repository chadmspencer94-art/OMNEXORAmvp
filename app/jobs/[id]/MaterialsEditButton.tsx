"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MaterialsEditButtonProps {
  jobId: string;
  currentOverrideText?: string | null;
  aiMaterials?: string | null;
}

/**
 * Formats AI materials JSON into a readable text format for editing
 */
function formatMaterialsForEditing(aiMaterials: string | null | undefined): string {
  if (!aiMaterials) return "";
  
  try {
    const materials = JSON.parse(aiMaterials);
    if (Array.isArray(materials) && materials.length > 0) {
      // Format as a readable list
      return materials
        .map((mat: { item?: string; quantity?: string; estimatedCost?: string }) => {
          const parts: string[] = [];
          if (mat.item) parts.push(mat.item);
          if (mat.quantity) parts.push(`x ${mat.quantity}`);
          if (mat.estimatedCost) parts.push(`- ${mat.estimatedCost}`);
          return parts.length > 0 ? parts.join(" ") : "";
        })
        .filter((line: string) => line.trim())
        .join("\n");
    }
  } catch {
    // If parsing fails, return the raw content
    return aiMaterials;
  }
  
  return "";
}

export default function MaterialsEditButton({
  jobId,
  currentOverrideText,
  aiMaterials,
}: MaterialsEditButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Pre-fill with current override text, or if none exists, format the AI materials
  const getInitialText = () => {
    if (currentOverrideText && currentOverrideText.trim()) {
      return currentOverrideText;
    }
    // If no override, format the AI materials for editing
    return formatMaterialsForEditing(aiMaterials);
  };
  
  const [overrideText, setOverrideText] = useState(getInitialText());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Update text when modal opens to ensure we have the latest content
  const handleOpen = () => {
    setOverrideText(getInitialText());
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/materials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialsOverrideText: overrideText.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save materials");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    // Just clear the textarea locally (don't save to server yet)
    setOverrideText("");
    setError("");
  };

  const handleClearAndSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/materials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialsOverrideText: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to clear materials");
        setIsSaving(false);
        return;
      }

      // Only clear the state after successful API response
      setOverrideText("");
      setIsSaving(false);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
      >
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {currentOverrideText ? "Edit override" : "Edit materials"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Edit Materials
              </h3>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Materials Notes
                </label>
                <textarea
                  value={overrideText}
                  onChange={(e) => setOverrideText(e.target.value)}
                  rows={8}
                  placeholder="Enter your final materials list and pricing here...&#10;&#10;Example:&#10;- Dulux Wash & Wear 10L x 2 - $350&#10;- Dulux Ceiling White 10L x 1 - $120&#10;- Primer 4L - $80&#10;- Sandpaper, fillers, tape - $50&#10;&#10;Total materials: ~$600 (ex GST)"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
                  disabled={isSaving}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use this to refine or correct material descriptions and pricing.
                  This will replace the AI materials section when viewing, emailing, or downloading the job pack.
                  {!currentOverrideText && aiMaterials && (
                    <span className="block mt-1 text-amber-700">
                      Current AI materials are pre-filled above. Make adjustments or clear to start fresh.
                    </span>
                  )}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
              <div>
                <button
                  onClick={handleClear}
                  disabled={isSaving}
                  className="px-4 py-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  title="Clear the textarea (you can still save or cancel)"
                >
                  Clear
                </button>
                {currentOverrideText && (
                  <button
                    onClick={handleClearAndSave}
                    disabled={isSaving}
                    className="ml-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    title="Remove override and revert to AI materials"
                  >
                    Remove Override
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
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
        </div>
      )}
    </>
  );
}

