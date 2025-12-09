"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

const VALID_TRADE_TYPES = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];

interface BusinessProfile {
  businessName: string | null;
  tradingName: string | null;
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

interface OnboardingWizardProps {
  initialData: BusinessProfile;
}

export default function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<BusinessProfile>(initialData);

  const totalSteps = 4;

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

  const validateStep = (step: number): boolean => {
    setError("");
    
    if (step === 1) {
      // Business Details: business name, primary trade, at least one work type
      if (!formData.businessName && !formData.tradingName) {
        setError("Please enter a business name or trading name.");
        return false;
      }
      if (!formData.primaryTrade) {
        setError("Please select your primary trade.");
        return false;
      }
      if (!formData.doesResidential && !formData.doesCommercial && !formData.doesStrata) {
        setError("Please select at least one work type.");
        return false;
      }
    } else if (step === 2) {
      // Service Area: radius OR postcodes
      if (
        (!formData.serviceRadiusKm || formData.serviceRadiusKm <= 0) &&
        (!formData.servicePostcodes || formData.servicePostcodes.trim().length === 0)
      ) {
        setError("Please specify a service radius or list service postcodes/suburbs.");
        return false;
      }
    } else if (step === 3) {
      // Pricing: at least one rate
      if (
        (!formData.hourlyRate || formData.hourlyRate <= 0) &&
        (!formData.ratePerM2Interior || formData.ratePerM2Interior <= 0) &&
        (!formData.ratePerM2Exterior || formData.ratePerM2Exterior <= 0) &&
        (!formData.ratePerLmTrim || formData.ratePerLmTrim <= 0)
      ) {
        setError("Please enter at least one pricing rate (hourly rate or area/linear rates).");
        return false;
      }
    }
    
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Save progress on each step
    setIsSaving(true);
    setError("");

    try {
      const profileResponse = await fetch("/api/settings/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to save progress");
      }

      // Move to next step on success
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } catch (err: any) {
      console.error("Error saving progress:", err);
      setError(err.message || "Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Save business profile
      const profileResponse = await fetch("/api/settings/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to save business profile");
      }

      // Mark onboarding as complete
      const completeResponse = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error completing onboarding:", err);
      setError(err.message || "Failed to complete onboarding. Please try again.");
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!window.confirm("Are you sure you want to skip onboarding? You can complete it later from Settings.")) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Save any progress made so far
      await fetch("/api/settings/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Mark onboarding as skipped (not completed)
      const skipResponse = await fetch("/api/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!skipResponse.ok) {
        throw new Error("Failed to skip onboarding");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error skipping onboarding:", err);
      setError(err.message || "Failed to skip onboarding. Please try again.");
      setIsSaving(false);
    }
  };

  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1:
        return "Business Details";
      case 2:
        return "Service Area";
      case 3:
        return "Pricing & Rates";
      case 4:
        return "Verification & Next Steps";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </h2>
          <span className="text-sm text-slate-500">
            {Math.round((currentStep / totalSteps) * 100)}% complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Business Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-slate-900 mb-4">Tell us about your business</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
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
                    Primary Trade <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Work Types <span className="text-red-500">*</span>
                  </label>
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
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Service Area */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-slate-900 mb-4">Where do you work?</h3>
              
              <div className="space-y-4">
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    disabled={isSaving}
                  />
                  <p className="mt-1 text-xs text-slate-500">Maximum distance you travel from your base location</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">OR</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="servicePostcodes" className="block text-sm font-medium text-slate-700 mb-2">
                    Service Postcodes / Suburbs <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="servicePostcodes"
                    name="servicePostcodes"
                    value={formData.servicePostcodes ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 6000, 6001, 6002 or Perth, Fremantle, Joondalup"
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                    disabled={isSaving}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    List postcodes or suburbs you service (comma or line separated)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing & Rates */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-slate-900 mb-4">Set your pricing</h3>
              <p className="text-sm text-slate-600 mb-4">
                Enter at least one rate. You can add more later in Settings.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="hourlyRate" className="block text-sm font-medium text-slate-700 mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={formData.hourlyRate ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 75"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="calloutFee" className="block text-sm font-medium text-slate-700 mb-2">
                    Callout Fee ($)
                  </label>
                  <input
                    type="number"
                    id="calloutFee"
                    name="calloutFee"
                    value={formData.calloutFee ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 150"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    disabled={isSaving}
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">Area & Linear Rates (optional)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="ratePerM2Interior" className="block text-sm font-medium text-slate-700 mb-2">
                        Interior ($/m²)
                      </label>
                      <input
                        type="number"
                        id="ratePerM2Interior"
                        name="ratePerM2Interior"
                        value={formData.ratePerM2Interior ?? ""}
                        onChange={handleChange}
                        placeholder="e.g. 25"
                        min="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label htmlFor="ratePerM2Exterior" className="block text-sm font-medium text-slate-700 mb-2">
                        Exterior ($/m²)
                      </label>
                      <input
                        type="number"
                        id="ratePerM2Exterior"
                        name="ratePerM2Exterior"
                        value={formData.ratePerM2Exterior ?? ""}
                        onChange={handleChange}
                        placeholder="e.g. 30"
                        min="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label htmlFor="ratePerLmTrim" className="block text-sm font-medium text-slate-700 mb-2">
                        Linear Metre ($/lm)
                      </label>
                      <input
                        type="number"
                        id="ratePerLmTrim"
                        name="ratePerLmTrim"
                        value={formData.ratePerLmTrim ?? ""}
                        onChange={handleChange}
                        placeholder="e.g. 15"
                        min="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Verification */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-slate-900 mb-4">Almost there!</h3>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Profile setup complete</p>
                    <p className="text-sm text-amber-700">
                      Your business profile is ready. To build more trust with clients and unlock full OMNEXORA features, 
                      complete business verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Next steps:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">✓</span>
                      <span>Business profile completed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">○</span>
                      <span>Complete business verification (optional but recommended)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">○</span>
                      <span>Create your first AI job pack</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <a
                    href="/settings/verification"
                    className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    Go to Verification Settings →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-2 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finish Setup
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Skip for now link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSaving}
              className="text-sm text-slate-500 hover:text-slate-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

