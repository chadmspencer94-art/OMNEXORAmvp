"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TemplateSelector from "./TemplateSelector";

type TradeType = "Painter" | "Plasterer" | "Carpenter" | "Electrician" | "Other";
type UserRole = "tradie" | "builder" | "client" | "supplier" | "admin";

interface Helper {
  id: string;
  name: string;
  ratePerHour: string;
}

interface FormData {
  clientName: string;
  clientEmail: string;
  title: string;
  tradeType: TradeType;
  propertyType: string;
  address: string;
  notes: string;
  labourRatePerHour: string;
  helperRatePerHour: string; // Legacy - kept for backwards compatibility
  helpers: Helper[]; // New: array of helpers
  materialsAreRoughEstimate: boolean;
  rateTemplateId: string | null;
}

interface JobTemplate {
  id: string;
  title: string;
  tradeType: string;
  propertyType: string;
  notes: string | null;
  addressLine1: string | null;
  suburb: string | null;
  postcode: string | null;
}

export default function NewJobPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [planTier, setPlanTier] = useState<string>("FREE");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientEmail: "",
    title: "",
    tradeType: "Painter",
    propertyType: "",
    address: "",
    notes: "",
    labourRatePerHour: "",
    helperRatePerHour: "", // Legacy
    helpers: [], // New: array of helpers
    materialsAreRoughEstimate: false,
    rateTemplateId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  // Fetch user role and plan info on mount
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserRole(data.user.role || "tradie");
            // Get plan tier from user data
            if (data.user.planTier) {
              setPlanTier(data.user.planTier);
            }
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoadingUser(false);
      }
    }
    fetchUserRole();
  }, [router]);

  const isClient = userRole === "client";

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear email error when user types
    if (name === "clientEmail") {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    // Validate email before submission
    if (formData.clientEmail && !validateEmail(formData.clientEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for submission
      // Remove client details - they will be entered manually after AI generation
      // Convert helpers array to the format expected by the API
      const helpers = formData.helpers
        .filter(h => h.ratePerHour && Number(h.ratePerHour) > 0)
        .map(h => ({
          id: h.id,
          name: h.name.trim() || undefined,
          ratePerHour: Number(h.ratePerHour),
        }));

      const submitData = {
        title: formData.title,
        tradeType: formData.tradeType,
        propertyType: formData.propertyType,
        address: formData.address,
        notes: formData.notes,
        labourRatePerHour: formData.labourRatePerHour ? Number(formData.labourRatePerHour) : null,
        helperRatePerHour: formData.helperRatePerHour ? Number(formData.helperRatePerHour) : null, // Legacy
        helpers: helpers.length > 0 ? helpers : undefined, // New: array of helpers
        materialsAreRoughEstimate: formData.materialsAreRoughEstimate,
        rateTemplateId: formData.rateTemplateId,
        // Explicitly exclude clientName and clientEmail for privacy
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create job");
        setIsLoading(false);
        return;
      }

      // Success - redirect to the job detail page
      // Keep isLoading true to prevent double submission during navigation
      router.push(`/jobs/${data.job.id}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">
          {isClient ? "Post a Job" : "New Job"}
        </h1>
        <p className="mt-2 text-slate-600">
          {isClient 
            ? "Post your job requirements and let tradies find you. No quote generation needed."
            : "Create a new AI-powered job pack for your client."}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Template Selector - Only for tradie/business users */}
              {!isClient && (
                <TemplateSelector
                  onSelectTemplate={setSelectedTemplate}
                  selectedTemplateId={selectedTemplate?.id || null}
                />
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Info Notice - Client details entered after AI generation */}
              {!isClient && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        Client Privacy & Safety First
                      </p>
                      <p className="text-sm text-amber-800">
                        Client details are kept private and will be entered manually after AI generation. This ensures client information is never sent to AI systems and you can review everything before sending.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Free Plan Warning Banner */}
              {!isClient && planTier === "FREE" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
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
                      disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                      disabled={isLoading}
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
                  
                  {/* Privacy Warning - Only show for tradies */}
                  {!isClient && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-amber-900 mb-1">
                            ⚠️ Privacy Warning: Do NOT include personal information
                          </p>
                          <p className="text-xs text-amber-800">
                            Do not include client names, email addresses, phone numbers, or other personal information in this field. This information will be sent to AI systems for job pack generation. Client details will be entered manually after you review the AI-generated content.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Include as much detail as possible:&#10;• Room list and sizes&#10;• Current condition of surfaces&#10;• Any prep work needed&#10;• Specific colours or products&#10;• Access considerations&#10;• Timeline requirements"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
                    disabled={isLoading}
                  />
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">💡 Example descriptions:</p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>• &quot;1x bedroom 3x3m, walls currently off-white, light prep needed&quot;</li>
                      <li>• &quot;Ceilings 2.4m high, some cracking, needs patch and sand&quot;</li>
                      <li>• &quot;Skirtings and doors semi-gloss, minor scuffs&quot;</li>
                      <li>• &quot;Access via front door, no furniture or light furniture&quot;</li>
                    </ul>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    The more detail you provide, the better your AI job pack will be.
                  </p>
                </div>
              </div>

              {/* Pricing Context Section - Only show for tradies */}
              {!isClient && (
                <div className="pt-6 border-t border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Pricing Context</h2>
                  <p className="text-sm text-slate-500 mb-4">Optional – helps AI generate more accurate quotes</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="labourRatePerHour" className="block text-sm font-medium text-slate-700 mb-2">
                        Your labour rate per hour (ex GST)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          id="labourRatePerHour"
                          name="labourRatePerHour"
                          value={formData.labourRatePerHour}
                          onChange={handleChange}
                          min="0"
                          step="1"
                          placeholder="50"
                          className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                          disabled={isLoading}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        If empty, we&apos;ll assume a typical rate for your trade in WA.
                      </p>
                    </div>

                  </div>

                  {/* Multiple Helpers Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Helpers (optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newHelper: Helper = {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: "",
                            ratePerHour: "",
                          };
                          setFormData((prev) => ({
                            ...prev,
                            helpers: [...prev.helpers, newHelper],
                          }));
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        disabled={isLoading}
                      >
                        + Add Helper
                      </button>
                    </div>
                    {formData.helpers.length > 0 && (
                      <div className="space-y-3">
                        {formData.helpers.map((helper, index) => (
                          <div key={helper.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Helper Name/Role (optional)
                                </label>
                                <input
                                  type="text"
                                  value={helper.name}
                                  onChange={(e) => {
                                    const updatedHelpers = [...formData.helpers];
                                    updatedHelpers[index].name = e.target.value;
                                    setFormData((prev) => ({ ...prev, helpers: updatedHelpers }));
                                  }}
                                  placeholder="e.g., Second Painter, Apprentice"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-sm"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Rate per Hour (ex GST)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                  <input
                                    type="number"
                                    value={helper.ratePerHour}
                                    onChange={(e) => {
                                      const updatedHelpers = [...formData.helpers];
                                      updatedHelpers[index].ratePerHour = e.target.value;
                                      setFormData((prev) => ({ ...prev, helpers: updatedHelpers }));
                                    }}
                                    min="0"
                                    step="1"
                                    placeholder="40"
                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-sm"
                                    disabled={isLoading}
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedHelpers = formData.helpers.filter((h) => h.id !== helper.id);
                                setFormData((prev) => ({ ...prev, helpers: updatedHelpers }));
                              }}
                              className="mt-6 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={isLoading}
                              title="Remove helper"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {formData.helpers.length === 0 && (
                      <p className="text-xs text-slate-500">
                        Add helpers if you usually work with additional team members. Each helper can have a name/role and hourly rate.
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      id="materialsAreRoughEstimate"
                      name="materialsAreRoughEstimate"
                      checked={formData.materialsAreRoughEstimate}
                      onChange={handleChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="materialsAreRoughEstimate" className="text-sm text-slate-700">
                      <span className="font-medium">Treat material prices as rough estimates only</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Yes – clearly state that material prices are approximate and must be checked against current supplier prices.
                      </p>
                    </label>
                  </div>
                </div>
              </div>
              )}

              {/* Submit Section */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-slate-500">
                    {isClient 
                      ? "Your job post will be visible to tradies in your area. They can contact you to provide quotes."
                      : "AI will generate a complete job pack including quote, scope, and materials."}
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/jobs"
                      className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {isClient ? "Posting Job..." : "Generating AI Pack..."}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isClient ? "M12 4v16m8-8H4" : "M13 10V3L4 14h7v7l9-11h-7z"} />
                          </svg>
                          {isClient ? "Post Job" : "Generate Job Pack"}
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isClient ? "M12 4v16m8-8H4" : "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"} />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {isClient ? "Posting Your Job" : "Generating AI Job Pack"}
            </h3>
            <p className="text-slate-600 text-sm">
              {isClient 
                ? "Your job post is being created. Tradies in your area will be able to see it and contact you."
                : "Our AI is creating your professional quote, scope of work, and materials list. This usually takes 10-20 seconds."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
