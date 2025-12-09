"use client";

import { useState } from "react";
import { Bookmark, Loader2, X, Check } from "lucide-react";
import type { Job } from "@/lib/jobs";

interface SaveAsTemplateButtonProps {
  job: Job;
}

export default function SaveAsTemplateButton({ job }: SaveAsTemplateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: job.title || "",
    includeSwms: false,
    includeVariationDoc: false,
    includeEotDoc: false,
    includeProgressClaim: false,
    includeHandoverChecklist: false,
    includeMaintenanceGuide: false,
  });

  const handleOpen = () => {
    setIsOpen(true);
    setError("");
    setSuccess(false);
    // Pre-fill with job data
    setFormData({
      title: job.title || "",
      includeSwms: false, // Default to false - user can enable if needed
      includeVariationDoc: false,
      includeEotDoc: false,
      includeProgressClaim: false,
      includeHandoverChecklist: false,
      includeMaintenanceGuide: false,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setSuccess(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      // Extract address components if address exists
      let addressLine1: string | undefined;
      let suburb: string | undefined;
      let state: string | undefined;
      let postcode: string | undefined;

      if (job.address) {
        // Simple parsing - split by comma
        const parts = job.address.split(",").map((p) => p.trim());
        addressLine1 = parts[0] || undefined;
        if (parts.length > 1) {
          // Try to extract postcode (last 4 digits)
          const lastPart = parts[parts.length - 1];
          const postcodeMatch = lastPart.match(/\b(\d{4})\b/);
          if (postcodeMatch) {
            postcode = postcodeMatch[1];
            suburb = parts[parts.length - 2] || undefined;
          } else {
            suburb = lastPart;
          }
        }
      }

      const response = await fetch("/api/job-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          tradeType: job.tradeType,
          propertyType: job.propertyType,
          addressLine1,
          suburb,
          state,
          postcode,
          notes: job.notes || null,
          defaultClientNotes: job.aiClientNotes || null,
          defaultMaterialsNotes: job.aiMaterials || null,
          includeSwms: formData.includeSwms,
          includeVariationDoc: formData.includeVariationDoc,
          includeEotDoc: formData.includeEotDoc,
          includeProgressClaim: formData.includeProgressClaim,
          includeHandoverChecklist: formData.includeHandoverChecklist,
          includeMaintenanceGuide: formData.includeMaintenanceGuide,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save template");
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        // Optionally refresh the page or show a toast
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
      >
        <Bookmark className="w-4 h-4 mr-2" />
        Save as Template
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Save as Template</h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Template saved – you can reuse this setup for future jobs.</span>
                </div>
              )}

              <div>
                <label htmlFor="template-title" className="block text-sm font-medium text-slate-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="template-title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 3×2 repaint – standard"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  disabled={isSaving}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Give this template a descriptive name so you can find it easily later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Include Documents by Default
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Select which documents should be generated automatically when using this template.
                </p>
                <div className="space-y-2">
                  {[
                    { key: "includeSwms", label: "SWMS (Safe Work Method Statement)" },
                    { key: "includeVariationDoc", label: "Variation / Change Order" },
                    { key: "includeEotDoc", label: "Extension of Time (EOT)" },
                    { key: "includeProgressClaim", label: "Progress Claim / Tax Invoice" },
                    { key: "includeHandoverChecklist", label: "Handover & Practical Completion" },
                    { key: "includeMaintenanceGuide", label: "Maintenance & Care Guide" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name={key}
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                        disabled={isSaving}
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.title.trim()}
                  className="inline-flex items-center px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save Template
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

