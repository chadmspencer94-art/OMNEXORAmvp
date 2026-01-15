"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Edit2, Trash2, FileText } from "lucide-react";

interface JobTemplate {
  id: string;
  title: string;
  tradeType: string;
  propertyType: string;
  notes: string | null;
  updatedAt: string;
  includeSwms: boolean;
  includeVariationDoc: boolean;
  includeEotDoc: boolean;
  includeProgressClaim: boolean;
  includeHandoverChecklist: boolean;
  includeMaintenanceGuide: boolean;
}

export default function JobTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    tradeType: "Painter",
    propertyType: "House",
    notes: "",
  });

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/job-templates");
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        } else if (response.status === 401) {
          router.push("/login");
        } else {
          setError("Failed to load templates");
        }
      } catch {
        setError("Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/job-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates([data.template, ...templates]);
        setShowCreateForm(false);
        setFormData({ title: "", tradeType: "Painter", propertyType: "House", notes: "" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create template");
      }
    } catch {
      setError("Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/job-templates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete template");
      }
    } catch {
      setError("Failed to delete template");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Job Templates</h1>
        <p className="text-slate-600">
          Create and manage reusable job templates to speed up job pack creation.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200 overflow-x-auto">
        <Link
          href="/settings/business-profile"
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
        >
          Business Profile
        </Link>
        <Link
          href="/settings"
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
        >
          Settings
        </Link>
        <Link
          href="/settings/templates"
          className="px-4 py-2.5 text-sm font-medium text-amber-600 border-b-2 border-amber-500 whitespace-nowrap"
        >
          Job Templates
        </Link>
        <Link
          href="/settings/verification"
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
        >
          Verification
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Create Template Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-6 inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Template</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 3x2 Standard Repaint"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tradeType" className="block text-sm font-medium text-slate-700 mb-2">
                  Trade Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="tradeType"
                  value={formData.tradeType}
                  onChange={(e) => setFormData({ ...formData, tradeType: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                  required
                >
                  <option value="Painter">Painter</option>
                  <option value="Plasterer">Plasterer</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                  required
                >
                  <option value="House">House</option>
                  <option value="Unit">Unit</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Strata">Strata</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                Default Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Default job description or scope notes..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Template"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: "", tradeType: "Painter", propertyType: "House", notes: "" });
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Your Templates</h2>
          <p className="text-sm text-slate-500 mt-1">
            Templates are scoped to your business account and not shared with other users.
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No templates yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Create your first template to speed up job pack creation.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {templates.map((template) => (
              <div key={template.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-slate-900 truncate">
                      {template.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {template.tradeType}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {template.propertyType}
                      </span>
                    </div>
                    {template.notes && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                        {template.notes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Updated {new Date(template.updatedAt).toLocaleDateString("en-AU")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
