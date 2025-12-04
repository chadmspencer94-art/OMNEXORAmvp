"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type TradeType = "Painter" | "Plasterer" | "Carpenter" | "Electrician" | "Other";

interface FormData {
  clientName: string;
  clientEmail: string;
  title: string;
  tradeType: TradeType;
  propertyType: string;
  address: string;
  notes: string;
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientEmail: "",
    title: "",
    tradeType: "Painter",
    propertyType: "",
    address: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    if (!email) return true; // Allow empty for backwards compatibility
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Load existing job data
  useEffect(() => {
    async function loadJob() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Job not found");
          } else if (response.status === 401 || response.status === 403) {
            router.push("/login");
            return;
          } else {
            setError("Failed to load job");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setFormData({
          clientName: data.job.clientName || "",
          clientEmail: data.job.clientEmail || "",
          title: data.job.title || "",
          tradeType: data.job.tradeType || "Painter",
          propertyType: data.job.propertyType || "",
          address: data.job.address || "",
          notes: data.job.notes || "",
        });
        setIsLoading(false);
      } catch {
        setError("Failed to load job");
        setIsLoading(false);
      }
    }

    loadJob();
  }, [jobId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear email error when user types
    if (name === "clientEmail") {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    // Validate email before submission (if provided)
    if (formData.clientEmail && !validateEmail(formData.clientEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update job");
        setIsSaving(false);
        return;
      }

      // Success - redirect to the job detail page
      router.push(`/jobs/${jobId}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="space-y-6">
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{error}</h2>
          <Link
            href="/jobs"
            className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium mt-4"
          >
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Job
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Job</h1>
        <p className="mt-2 text-slate-600">Update the job details. You can regenerate the AI pack after saving.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Client Details Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 mb-2">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="e.g. John Smith"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-700 mb-2">
                      Client Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="clientEmail"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors ${
                        emailError ? "border-red-500" : "border-slate-300"
                      }`}
                      required
                      disabled={isSaving}
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Details Section */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. 3x2 repaint – Baldivis"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tradeType" className="block text-sm font-medium text-slate-700 mb-2">
                        Trade Type
                      </label>
                      <select
                        id="tradeType"
                        name="tradeType"
                        value={formData.tradeType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white"
                        disabled={isSaving}
                      >
                        <option value="Painter">Painter</option>
                        <option value="Plasterer">Plasterer</option>
                        <option value="Carpenter">Carpenter</option>
                        <option value="Electrician">Electrician</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-2">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="propertyType"
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                        placeholder="e.g. Single-storey house"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                        required
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                      Property Address <span className="text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. 123 Main St, Baldivis WA 6171"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Details</h2>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                    Job Description / Notes <span className="text-slate-400">(recommended)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Include as much detail as possible:&#10;• Room list and sizes&#10;• Current condition of surfaces&#10;• Any prep work needed&#10;• Specific colours or products&#10;• Access considerations&#10;• Timeline requirements"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
                    disabled={isSaving}
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    The more detail you provide, the better your AI job pack will be.
                  </p>
                </div>
              </div>

              {/* Submit Section */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-slate-500">
                    After saving, you can regenerate the AI job pack with the updated details.
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/jobs/${jobId}`}
                      className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

