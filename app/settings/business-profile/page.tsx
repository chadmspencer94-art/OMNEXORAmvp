"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { featureFlags } from "@/lib/featureFlags";

interface BusinessProfile {
  // Business Details
  businessName: string | null;
  abn: string | null;
  primaryTrade: string | null;
  tradeTypes: string | null;
  doesResidential: boolean;
  doesCommercial: boolean;
  doesStrata: boolean;
  serviceRadiusKm: number | null;
  servicePostcodes: string | null;
  
  // Core Rates (from business-profile)
  hourlyRate: number | null;
  calloutFee: number | null;
  ratePerM2Interior: number | null;
  ratePerM2Exterior: number | null;
  ratePerLmTrim: number | null;
  
  // Pricing Settings (from /settings)
  dayRate: number | null;
  materialMarkupPercent: number | null;
  roughEstimateOnly: boolean | null;
  
  // Business Rates (from business-rates)
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
}

const VALID_TRADE_TYPES = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];

export default function BusinessProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
    dayRate: null,
    materialMarkupPercent: null,
    roughEstimateOnly: null,
    gstRegistered: false,
    defaultMarginPct: null,
    defaultDepositPct: null,
    defaultPaymentTerms: null,
    tradeRates: null,
  });

  // Fetch all business profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        // Check user role first
        const settingsResponse = await fetch("/api/settings");
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setUserRole(settingsData.user.role || null);
          
          // Redirect clients - they don't have business profiles
          if (settingsData.user.role === "client") {
            router.push("/settings");
            return;
          }
        }
        
        // Fetch business profile
        const profileResponse = await fetch("/api/settings/business-profile");
        const profileData = profileResponse.ok ? await profileResponse.json() : null;
        
        // Fetch pricing settings
        const pricingResponse = await fetch("/api/settings");
        const pricingData = pricingResponse.ok ? await pricingResponse.json() : null;
        
        // Fetch business rates
        const ratesResponse = await fetch("/api/settings/business-rates");
        const ratesData = ratesResponse.ok ? await ratesResponse.json() : null;
        
        if (profileResponse.status === 401 || pricingResponse.status === 401 || ratesResponse.status === 401) {
          router.push("/login");
          return;
        }
        
        // Merge all data
        setFormData({
          ...(profileData?.businessProfile || {}),
          dayRate: pricingData?.user?.dayRate ?? null,
          materialMarkupPercent: pricingData?.user?.materialMarkupPercent ?? null,
          roughEstimateOnly: pricingData?.user?.roughEstimateOnly ?? null,
          gstRegistered: ratesData?.businessRates?.gstRegistered ?? false,
          defaultMarginPct: ratesData?.businessRates?.defaultMarginPct ?? null,
          defaultDepositPct: ratesData?.businessRates?.defaultDepositPct ?? null,
          defaultPaymentTerms: ratesData?.businessRates?.defaultPaymentTerms ?? null,
          tradeRates: ratesData?.businessRates?.tradeRates ?? null,
        });
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
      // Save business profile
      const profileResponse = await fetch("/api/settings/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          abn: formData.abn,
          primaryTrade: formData.primaryTrade,
          tradeTypes: formData.tradeTypes,
          doesResidential: formData.doesResidential,
          doesCommercial: formData.doesCommercial,
          doesStrata: formData.doesStrata,
          serviceRadiusKm: formData.serviceRadiusKm,
          servicePostcodes: formData.servicePostcodes,
          hourlyRate: formData.hourlyRate,
          calloutFee: formData.calloutFee,
          ratePerM2Interior: formData.ratePerM2Interior,
          ratePerM2Exterior: formData.ratePerM2Exterior,
          ratePerLmTrim: formData.ratePerLmTrim,
        }),
      });

      // Save pricing settings
      const pricingResponse = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRate: formData.hourlyRate,
          dayRate: formData.dayRate,
          materialMarkupPercent: formData.materialMarkupPercent,
          roughEstimateOnly: formData.roughEstimateOnly,
        }),
      });

      // Save business rates
      const ratesResponse = await fetch("/api/settings/business-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstRegistered: formData.gstRegistered,
          defaultMarginPct: formData.defaultMarginPct,
          defaultDepositPct: formData.defaultDepositPct,
          defaultPaymentTerms: formData.defaultPaymentTerms,
          tradeRates: formData.tradeRates,
          dayRate: formData.dayRate,
          hourlyRate: formData.hourlyRate,
          calloutFee: formData.calloutFee,
        }),
      });

      if (!profileResponse.ok || !pricingResponse.ok || !ratesResponse.ok) {
        const profileError = await profileResponse.json().catch(() => ({ error: "Failed to save business profile" }));
        const pricingError = await pricingResponse.json().catch(() => ({ error: "Failed to save pricing settings" }));
        const ratesError = await ratesResponse.json().catch(() => ({ error: "Failed to save business rates" }));
        setError(profileError.error || pricingError.error || ratesError.error || "Failed to save settings");
        setIsSaving(false);
        return;
      }

      setSuccess(true);
      setIsSaving(false);
      
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

  // Redirect clients - they don't have business profiles
  if (userRole === "client") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Client Profile</h2>
          <p className="text-slate-600 mb-4">
            Business profiles are for trade and construction businesses only. Clients have access to client profile settings.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            Go to Client Profile
          </Link>
        </div>
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
          Manage your Australian construction business details, work types, service areas, pricing rates, and business settings.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200 overflow-x-auto">
        <Link
          href="/settings/business-profile"
          className="px-4 py-2.5 text-sm font-medium text-amber-600 border-b-2 border-amber-500 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
        >
          Business Profile
        </Link>
        <Link
          href="/settings"
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
        >
          Settings
        </Link>
        {featureFlags.showRateTemplates && (
          <Link
            href="/settings/rates"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Rate Templates
          </Link>
        )}
        {featureFlags.showMaterials && (
          <Link
            href="/settings/materials"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Materials
          </Link>
        )}
        <Link
          href="/settings/verification"
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
        >
          Verification
        </Link>
        {featureFlags.showSignature && (
          <Link
            href="/settings/signature"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Signature
          </Link>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Business profile updated successfully!
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
          <p className="text-sm text-slate-600 mb-4">
            Your business information for the Australian construction industry.
          </p>
          
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

        {/* Core Rates Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Core Rates</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure your standard rates. These will be used for quoting and job matching.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label htmlFor="dayRate" className="block text-sm font-medium text-slate-700 mb-2">
                Day Rate ($/day) <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  id="dayRate"
                  name="dayRate"
                  value={formData.dayRate ?? ""}
                  onChange={handleChange}
                  placeholder="e.g. 400"
                  min="0"
                  step="1"
                  className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="calloutFee" className="block text-sm font-medium text-slate-700 mb-2">
              Callout / Minimum Fee ($) <span className="text-slate-400 font-normal">(optional)</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Pricing Settings Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Pricing Settings</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure default pricing behavior for job packs and quotes.
          </p>
          
          <div>
            <label htmlFor="materialMarkupPercent" className="block text-sm font-medium text-slate-700 mb-2">
              Material Markup (%)
            </label>
            <div className="relative">
              <input
                type="number"
                id="materialMarkupPercent"
                name="materialMarkupPercent"
                value={formData.materialMarkupPercent ?? ""}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Default markup percentage applied to material costs (0-100%)</p>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="roughEstimateOnly"
              name="roughEstimateOnly"
              checked={formData.roughEstimateOnly ?? false}
              onChange={handleChange}
              className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
              disabled={isSaving}
            />
            <div className="flex-1">
              <label htmlFor="roughEstimateOnly" className="block text-sm font-medium text-slate-700 mb-1">
                Show prices as rough estimate only?
              </label>
              <p className="text-xs text-slate-500">
                When enabled, all job pack prices will be marked as rough estimates.
              </p>
            </div>
          </div>
        </div>

        {/* Business Settings Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Business Settings</h2>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="gstRegistered"
              name="gstRegistered"
              checked={formData.gstRegistered}
              onChange={handleChange}
              className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
              disabled={isSaving}
            />
            <label htmlFor="gstRegistered" className="text-sm text-slate-700">
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
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-slate-500">This will be included in client-facing quotes and invoices.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultMarginPct" className="block text-sm font-medium text-slate-700 mb-2">
                Default Margin % on Materials
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="defaultMarginPct"
                  name="defaultMarginPct"
                  value={formData.defaultMarginPct ?? ""}
                  onChange={handleChange}
                  placeholder="15"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  disabled={isSaving}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="defaultDepositPct" className="block text-sm font-medium text-slate-700 mb-2">
                Default Deposit % Requested
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="defaultDepositPct"
                  name="defaultDepositPct"
                  value={formData.defaultDepositPct ?? ""}
                  onChange={handleChange}
                  placeholder="30"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  disabled={isSaving}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Painter Rates Section (optional) */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Painter Rates (optional)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Configure per-square-metre and per-item rates for painting work. Leave blank if not applicable.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wallsPerM2" className="block text-sm font-medium text-slate-700 mb-2">
                Walls per m² ($)
              </label>
              <input
                type="number"
                id="wallsPerM2"
                value={formData.tradeRates?.painter?.wallsPerM2 || ""}
                onChange={(e) => handleTradeRateChange("wallsPerM2", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>

            <div>
              <label htmlFor="ceilingsPerM2" className="block text-sm font-medium text-slate-700 mb-2">
                Ceilings per m² ($)
              </label>
              <input
                type="number"
                id="ceilingsPerM2"
                value={formData.tradeRates?.painter?.ceilingsPerM2 || ""}
                onChange={(e) => handleTradeRateChange("ceilingsPerM2", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>

            <div>
              <label htmlFor="trimPerM" className="block text-sm font-medium text-slate-700 mb-2">
                Trim per metre ($)
              </label>
              <input
                type="number"
                id="trimPerM"
                value={formData.tradeRates?.painter?.trimPerM || ""}
                onChange={(e) => handleTradeRateChange("trimPerM", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>

            <div>
              <label htmlFor="doorsEach" className="block text-sm font-medium text-slate-700 mb-2">
                Doors each ($)
              </label>
              <input
                type="number"
                id="doorsEach"
                value={formData.tradeRates?.painter?.doorsEach || ""}
                onChange={(e) => handleTradeRateChange("doorsEach", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Business Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
