"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BusinessRates {
  gstRegistered: boolean;
  defaultMarginPct: number | null;
  defaultDepositPct: number | null;
  defaultPaymentTerms: string | null;
  tradeRates: {
    painter?: {
      wallsPerM2?: number;
      ceilingsPerM2?: number;
      trimPerM?: number;
      doorsEach?: number;
    };
  } | null;
  dayRate: number | null;
  hourlyRate: number | null;
  calloutFee: number | null;
}

export default function BusinessRatesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BusinessRates>({
    gstRegistered: false,
    defaultMarginPct: null,
    defaultDepositPct: null,
    defaultPaymentTerms: null,
    tradeRates: null,
    dayRate: null,
    hourlyRate: null,
    calloutFee: null,
  });

  // Fetch current business rates on mount
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch("/api/settings/business-rates");
        if (response.ok) {
          const data = await response.json();
          setFormData(data.businessRates);
        } else if (response.status === 401) {
          router.push("/login");
        } else {
          setError("Failed to load business rates");
        }
      } catch {
        setError("Failed to load business rates");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleTradeRateChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setFormData((prev) => ({
      ...prev,
      tradeRates: {
        ...(prev.tradeRates || {}),
        painter: {
          ...(prev.tradeRates?.painter || {}),
          [field]: numValue,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/business-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save business rates");
        setIsSaving(false);
        return;
      }

      setSuccess(true);
      setIsSaving(false);
      setFormData(data.businessRates);
      
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Business & Rates</h1>
        <p className="text-slate-600">
          Configure your default pricing, margins, payment terms, and trade-specific rates.
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
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Business Profile
        </Link>
        <Link
          href="/settings/business-rates"
          className="px-4 py-2 text-sm font-medium text-amber-600 border-b-2 border-amber-500"
        >
          Business & Rates
        </Link>
        <Link
          href="/settings/rates"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Rate Templates
        </Link>
        <Link
          href="/settings/materials"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Materials
        </Link>
        <Link
          href="/settings/verification"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Verification
        </Link>
        <Link
          href="/settings/signature"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Signature
        </Link>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Business settings updated successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Business Rates Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Business Basics */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Business Basics</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="gstRegistered"
                name="gstRegistered"
                checked={formData.gstRegistered}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="gstRegistered" className="ml-2 text-sm text-slate-700">
                GST Registered
              </label>
            </div>

            <div>
              <label htmlFor="defaultPaymentTerms" className="block text-sm font-medium text-slate-700 mb-2">
                Default Payment Terms
              </label>
              <input
                type="text"
                id="defaultPaymentTerms"
                name="defaultPaymentTerms"
                value={formData.defaultPaymentTerms || ""}
                onChange={handleChange}
                placeholder="e.g. 7 days from invoice"
                maxLength={100}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">This will be included in client-facing quotes and invoices.</p>
            </div>
          </div>
        </div>

        {/* Core Rates */}
        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Core Rates</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-slate-700 mb-2">
                Hourly Rate (AUD)
              </label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate || ""}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="50"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Base hourly rate for labour ($/hr)</p>
            </div>

            <div>
              <label htmlFor="dayRate" className="block text-sm font-medium text-slate-700 mb-2">
                Day Rate (AUD) <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                id="dayRate"
                name="dayRate"
                value={formData.dayRate || ""}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="400"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Optional day rate for full-day jobs</p>
            </div>

            <div>
              <label htmlFor="calloutFee" className="block text-sm font-medium text-slate-700 mb-2">
                Call-out / Minimum Fee (AUD) <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                id="calloutFee"
                name="calloutFee"
                value={formData.calloutFee || ""}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="100"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum charge or call-out fee</p>
            </div>
          </div>
        </div>

        {/* Pricing Defaults */}
        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Defaults</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="defaultMarginPct" className="block text-sm font-medium text-slate-700 mb-2">
                Default Margin % on Materials
              </label>
              <input
                type="number"
                id="defaultMarginPct"
                name="defaultMarginPct"
                value={formData.defaultMarginPct || ""}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                placeholder="15"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Default markup percentage applied to material costs (0-100%)</p>
            </div>

            <div>
              <label htmlFor="defaultDepositPct" className="block text-sm font-medium text-slate-700 mb-2">
                Default Deposit % Requested
              </label>
              <input
                type="number"
                id="defaultDepositPct"
                name="defaultDepositPct"
                value={formData.defaultDepositPct || ""}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                placeholder="30"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Default deposit percentage requested upfront (0-100%)</p>
            </div>
          </div>
        </div>

        {/* Painter Rates (optional) */}
        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Painter Rates (optional)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure per-square-metre and per-item rates for painting work. Leave blank if not applicable.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="wallsPerM2" className="block text-sm font-medium text-slate-700 mb-2">
                Walls per m² (AUD)
              </label>
              <input
                type="number"
                id="wallsPerM2"
                value={formData.tradeRates?.painter?.wallsPerM2 || ""}
                onChange={(e) => handleTradeRateChange("wallsPerM2", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="ceilingsPerM2" className="block text-sm font-medium text-slate-700 mb-2">
                Ceilings per m² (AUD)
              </label>
              <input
                type="number"
                id="ceilingsPerM2"
                value={formData.tradeRates?.painter?.ceilingsPerM2 || ""}
                onChange={(e) => handleTradeRateChange("ceilingsPerM2", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="trimPerM" className="block text-sm font-medium text-slate-700 mb-2">
                Trim per metre (AUD)
              </label>
              <input
                type="number"
                id="trimPerM"
                value={formData.tradeRates?.painter?.trimPerM || ""}
                onChange={(e) => handleTradeRateChange("trimPerM", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="doorsEach" className="block text-sm font-medium text-slate-700 mb-2">
                Doors each (AUD)
              </label>
              <input
                type="number"
                id="doorsEach"
                value={formData.tradeRates?.painter?.doorsEach || ""}
                onChange={(e) => handleTradeRateChange("doorsEach", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

