"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BusinessProfile {
  businessName: string | null;
  abn: string | null;
  primaryTrade: string | null;
  tradeTypes: string | null;
  doesResidential: boolean;
  doesCommercial: boolean;
  doesStrata: boolean;
  serviceRadiusKm: number | null;
  servicePostcodes: string | null;
  hourlyRate: number | null;
  calloutFee: number | null;
  ratePerM2Interior: number | null;
  ratePerM2Exterior: number | null;
  ratePerLmTrim: number | null;
}

const VALID_TRADE_TYPES = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];

export default function BusinessProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BusinessProfile>({
    businessName: null,
    abn: null,
    primaryTrade: null,
    tradeTypes: null,
    doesResidential: true,
    doesCommercial: false,
    doesStrata: false,
    serviceRadiusKm: null,
    servicePostcodes: null,
    hourlyRate: null,
    calloutFee: null,
    ratePerM2Interior: null,
    ratePerM2Exterior: null,
    ratePerLmTrim: null,
  });

  // Fetch current business profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/settings/business-profile");
        if (response.ok) {
          const data = await response.json();
          setFormData(data.businessProfile);
        } else if (response.status === 401) {
          router.push("/login");
        } else {
          setError("Failed to load business profile");
        }
      } catch {
        setError("Failed to load business profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      const numValue = value === "" ? null : Number(value);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? null : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save business profile");
        setIsSaving(false);
        return;
      }

      setSuccess(true);
      setIsSaving(false);
      setFormData(data.businessProfile); // Update with saved data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Business Profile</h1>
        <p className="text-slate-600">
          Manage your business details, work types, service area, and pricing rates.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-3 border-b border-slate-200">
        <Link
          href="/settings"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Pricing
        </Link>
        <Link
          href="/settings/business-profile"
          className="px-4 py-2 text-sm font-medium text-amber-600 border-b-2 border-amber-500"
        >
          Business Profile
        </Link>
        <Link
          href="/settings/verification"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Verification
        </Link>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Profile updated successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Business Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        {/* Business Details Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Business Details</h2>
          
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName ?? ""}
              onChange={handleChange}
              placeholder="e.g. Perth Pro Painters Pty Ltd"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="abn" className="block text-sm font-medium text-slate-700 mb-2">
              ABN
            </label>
            <input
              type="text"
              id="abn"
              name="abn"
              value={formData.abn ?? ""}
              onChange={handleChange}
              placeholder="e.g. 12 345 678 901"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="primaryTrade" className="block text-sm font-medium text-slate-700 mb-2">
              Primary Trade
            </label>
            <select
              id="primaryTrade"
              name="primaryTrade"
              value={formData.primaryTrade ?? ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              disabled={isSaving}
            >
              <option value="">Select a trade...</option>
              {VALID_TRADE_TYPES.map((trade) => (
                <option key={trade} value={trade}>
                  {trade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tradeTypes" className="block text-sm font-medium text-slate-700 mb-2">
              Other Trades
            </label>
            <textarea
              id="tradeTypes"
              name="tradeTypes"
              value={formData.tradeTypes ?? ""}
              onChange={handleChange}
              placeholder="e.g. Painter, Plasterer (comma separated)"
              rows={2}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-slate-500">Separate multiple trades with commas</p>
          </div>
        </div>

        {/* Work Types Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Work Types</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="doesResidential"
                name="doesResidential"
                checked={formData.doesResidential}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                disabled={isSaving}
              />
              <div className="flex-1">
                <label htmlFor="doesResidential" className="block text-sm font-medium text-slate-700">
                  Residential
                </label>
                <p className="text-xs text-slate-500 mt-0.5">I work on residential properties</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="doesCommercial"
                name="doesCommercial"
                checked={formData.doesCommercial}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                disabled={isSaving}
              />
              <div className="flex-1">
                <label htmlFor="doesCommercial" className="block text-sm font-medium text-slate-700">
                  Commercial
                </label>
                <p className="text-xs text-slate-500 mt-0.5">I work on commercial properties</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="doesStrata"
                name="doesStrata"
                checked={formData.doesStrata}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                disabled={isSaving}
              />
              <div className="flex-1">
                <label htmlFor="doesStrata" className="block text-sm font-medium text-slate-700">
                  Strata
                </label>
                <p className="text-xs text-slate-500 mt-0.5">I work on strata properties</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Area Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Service Area</h2>
          
          <div>
            <label htmlFor="serviceRadiusKm" className="block text-sm font-medium text-slate-700 mb-2">
              Service Radius (km)
            </label>
            <input
              type="number"
              id="serviceRadiusKm"
              name="serviceRadiusKm"
              value={formData.serviceRadiusKm ?? ""}
              onChange={handleChange}
              placeholder="e.g. 50"
              min="0"
              step="1"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-slate-500">Typical maximum distance you travel from your base</p>
          </div>

          <div>
            <label htmlFor="servicePostcodes" className="block text-sm font-medium text-slate-700 mb-2">
              Service Areas / Postcodes
            </label>
            <textarea
              id="servicePostcodes"
              name="servicePostcodes"
              value={formData.servicePostcodes ?? ""}
              onChange={handleChange}
              placeholder="e.g. Rockingham, Kwinana, 6168, 6169"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-slate-500">List suburbs, postcodes, or areas you service (one per line or comma separated)</p>
          </div>
        </div>

        {/* Pricing / Rates Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Pricing / Rates</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure your standard rates. These will be used for quoting and job matching.
          </p>
          
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-slate-700 mb-2">
              Hourly Rate ($/hr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate ?? ""}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="calloutFee" className="block text-sm font-medium text-slate-700 mb-2">
              Callout Fee ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="calloutFee"
                name="calloutFee"
                value={formData.calloutFee ?? ""}
                onChange={handleChange}
                placeholder="e.g. 100"
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ratePerM2Interior" className="block text-sm font-medium text-slate-700 mb-2">
              Rate per m² Interior ($/m²)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="ratePerM2Interior"
                name="ratePerM2Interior"
                value={formData.ratePerM2Interior ?? ""}
                onChange={handleChange}
                placeholder="e.g. 25"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ratePerM2Exterior" className="block text-sm font-medium text-slate-700 mb-2">
              Rate per m² Exterior ($/m²)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="ratePerM2Exterior"
                name="ratePerM2Exterior"
                value={formData.ratePerM2Exterior ?? ""}
                onChange={handleChange}
                placeholder="e.g. 20"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ratePerLmTrim" className="block text-sm font-medium text-slate-700 mb-2">
              Rate per Linear Metre Trim ($/lm)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="ratePerLmTrim"
                name="ratePerLmTrim"
                value={formData.ratePerLmTrim ?? ""}
                onChange={handleChange}
                placeholder="e.g. 15"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">For trims, handrails, and other linear measurements</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

