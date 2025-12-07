"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PricingSettings {
  hourlyRate: number | null;
  dayRate: number | null;
  materialMarkupPercent: number | null;
  roughEstimateOnly: boolean | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    hourlyRate: null,
    dayRate: null,
    materialMarkupPercent: null,
    roughEstimateOnly: null,
  });

  // Default values (used when displaying empty fields)
  const DEFAULT_HOURLY_RATE = 50;
  const DEFAULT_DAY_RATE = null;
  const DEFAULT_MATERIAL_MARKUP = 0;
  const DEFAULT_ROUGH_ESTIMATE_ONLY = true;

  // Fetch current settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setPricingSettings({
            hourlyRate: data.user.hourlyRate ?? null,
            dayRate: data.user.dayRate ?? null,
            materialMarkupPercent: data.user.materialMarkupPercent ?? null,
            roughEstimateOnly: data.user.roughEstimateOnly ?? null,
          });
        } else if (response.status === 401) {
          router.push("/login");
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setPricingSettings((prev) => ({ ...prev, [name]: checked }));
    } else {
      // For number inputs, allow empty string (will be converted to null)
      const numValue = value === "" ? null : Number(value);
      setPricingSettings((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricingSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save settings");
        setIsSaving(false);
        return;
      }

      setSuccess(true);
      setIsSaving(false);
      
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-3 border-b border-slate-200">
        <Link
          href="/settings"
          className="px-4 py-2 text-sm font-medium text-amber-600 border-b-2 border-amber-500"
        >
          Pricing
        </Link>
        <Link
          href="/settings/business-profile"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
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
          Settings saved successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Pricing Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Settings</h2>
          <p className="text-sm text-slate-600 mb-6">
            Configure your default pricing rates. These will be used when generating job packs to provide more accurate estimates.
          </p>
        </div>

        {/* Hourly Rate */}
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
              value={pricingSettings.hourlyRate ?? ""}
              onChange={handleChange}
              placeholder={DEFAULT_HOURLY_RATE.toString()}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Default: ${DEFAULT_HOURLY_RATE}/hr (used if not set)
          </p>
        </div>

        {/* Day Rate */}
        <div>
          <label htmlFor="dayRate" className="block text-sm font-medium text-slate-700 mb-2">
            Day Rate ($/day) <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              id="dayRate"
              name="dayRate"
              value={pricingSettings.dayRate ?? ""}
              onChange={handleChange}
              placeholder="Leave empty if not applicable"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Optional flat daily rate for full-day jobs
          </p>
        </div>

        {/* Material Markup */}
        <div>
          <label htmlFor="materialMarkupPercent" className="block text-sm font-medium text-slate-700 mb-2">
            Material Markup (%)
          </label>
          <div className="relative">
            <input
              type="number"
              id="materialMarkupPercent"
              name="materialMarkupPercent"
              value={pricingSettings.materialMarkupPercent ?? ""}
              onChange={handleChange}
              placeholder={DEFAULT_MATERIAL_MARKUP.toString()}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Default: {DEFAULT_MATERIAL_MARKUP}% (used if not set). Percentage markup to add to material costs.
          </p>
        </div>

        {/* Rough Estimate Only */}
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="roughEstimateOnly"
            name="roughEstimateOnly"
            checked={pricingSettings.roughEstimateOnly ?? DEFAULT_ROUGH_ESTIMATE_ONLY}
            onChange={handleChange}
            className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
            disabled={isSaving}
          />
          <div className="flex-1">
            <label htmlFor="roughEstimateOnly" className="block text-sm font-medium text-slate-700 mb-1">
              Show prices as rough estimate only?
            </label>
            <p className="text-xs text-slate-500">
              When enabled, all job pack prices will be marked as rough estimates. Default: {DEFAULT_ROUGH_ESTIMATE_ONLY ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

