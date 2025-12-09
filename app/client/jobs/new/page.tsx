"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const PROPERTY_TYPES = [
  "House",
  "Unit",
  "Townhouse",
  "Strata",
  "Commercial",
  "Other",
];

const TIMEFRAMES = [
  "ASAP",
  "Within 2 weeks",
  "Within 1 month",
  "Flexible",
];

export default function NewClientJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    propertyType: "",
    address: "",
    suburb: "",
    postcode: "",
    description: "",
    timeframe: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Build full address
      const addressParts = [
        formData.address,
        formData.suburb,
        formData.postcode,
      ].filter(Boolean);
      const fullAddress = addressParts.join(", ");

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          propertyType: formData.propertyType,
          address: fullAddress || undefined,
          notes: formData.description.trim() || undefined,
          // Client-specific metadata (can be stored in notes or a separate field)
          timeframe: formData.timeframe || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create job request");
      }

      // Redirect to client dashboard with success message
      router.push("/client/dashboard?created=true");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Post a New Job Request</h1>
        <p className="text-slate-600 mb-8">
          Tell us about the work you need done. A tradie will review your request and send you a quote.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Paint interior of 3-bedroom house"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Property Type */}
          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-2">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              disabled={isLoading}
            >
              <option value="">Select property type...</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Address Fields */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property Address
            </label>
            <div className="space-y-3">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isLoading}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="suburb"
                  value={formData.suburb}
                  onChange={handleChange}
                  placeholder="Suburb"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  placeholder="Postcode"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description of Work <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Describe the work you need done in detail. Include any specific requirements, materials, or preferences..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y"
              disabled={isLoading}
            />
          </div>

          {/* Timeframe */}
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-slate-700 mb-2">
              Desired Timeframe
            </label>
            <select
              id="timeframe"
              name="timeframe"
              value={formData.timeframe}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              disabled={isLoading}
            >
              <option value="">Select timeframe...</option>
              {TIMEFRAMES.map((timeframe) => (
                <option key={timeframe} value={timeframe}>
                  {timeframe}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> Photo uploads will be available soon. For now, please include any important details in the description above.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <Link
              href="/client/dashboard"
              className="text-sm text-slate-600 hover:text-slate-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Job Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

