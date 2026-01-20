"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  Plus,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
  Zap,
} from "lucide-react";
import TemplateSelector from "./TemplateSelector";
import OvisBadge from "@/app/components/OvisBadge";

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
  helperRatePerHour: string;
  helpers: Helper[];
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

// Progress step component
function ProgressStep({ 
  step, 
  label, 
  isActive, 
  isComplete 
}: { 
  step: number; 
  label: string; 
  isActive: boolean; 
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
          isComplete
            ? "bg-emerald-500 text-white"
            : isActive
            ? "bg-amber-500 text-slate-900"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {isComplete ? <CheckCircle className="w-4 h-4" /> : step}
      </div>
      <span
        className={`text-sm font-medium hidden sm:inline ${
          isActive ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// Section card component
function SectionCard({
  icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Input field component
function InputField({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-slate-400 ml-1">(optional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [planTier, setPlanTier] = useState<string>("FREE");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientEmail: "",
    title: "",
    tradeType: "Painter",
    propertyType: "",
    address: "",
    notes: "",
    labourRatePerHour: "",
    helperRatePerHour: "",
    helpers: [],
    materialsAreRoughEstimate: false,
    rateTemplateId: null,
  });
  const [businessProfile, setBusinessProfile] = useState<{
    primaryTrade: string | null;
    hourlyRate: number | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  // Track form completion for steps
  const step1Complete = formData.title.trim() !== "" && formData.propertyType.trim() !== "";
  const step2Complete = formData.notes.trim() !== "";

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserRole(data.user.role || "tradie");
            if (data.user.planTier) {
              setPlanTier(data.user.planTier);
            }
            
            if (data.user.role !== "client") {
              try {
                const profileResponse = await fetch("/api/settings/business-profile", { cache: "no-store" });
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  if (profileData.businessProfile) {
                    setBusinessProfile({
                      primaryTrade: profileData.businessProfile.primaryTrade,
                      hourlyRate: profileData.businessProfile.hourlyRate,
                    });
                    
                    if (profileData.businessProfile.primaryTrade) {
                      const validTradeTypes: TradeType[] = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];
                      if (validTradeTypes.includes(profileData.businessProfile.primaryTrade as TradeType)) {
                        setFormData((prev) => ({
                          ...prev,
                          tradeType: profileData.businessProfile.primaryTrade as TradeType,
                        }));
                      }
                    }
                    
                    if (profileData.businessProfile.hourlyRate && !formData.labourRatePerHour) {
                      setFormData((prev) => ({
                        ...prev,
                        labourRatePerHour: profileData.businessProfile.hourlyRate.toString(),
                      }));
                    }
                  }
                }
              } catch (error) {
                console.warn("Failed to fetch business profile:", error);
              }
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
    fetchUserData();
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
    
    if (name === "clientEmail") {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (formData.clientEmail && !validateEmail(formData.clientEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
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
        helperRatePerHour: formData.helperRatePerHour ? Number(formData.helperRatePerHour) : null,
        helpers: helpers.length > 0 ? helpers : undefined,
        materialsAreRoughEstimate: formData.materialsAreRoughEstimate,
        rateTemplateId: formData.rateTemplateId,
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[jobs] failed to parse response:", parseError);
        setError("Failed to create job: Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorMsg = data?.error || "Failed to create job";
        console.error("[jobs] error creating job:", errorMsg, data);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      if (!data?.job || !data.job.id) {
        console.error("[jobs] invalid response from job creation API:", data);
        setError("Failed to create job: Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log(`[jobs] successfully created job ${data.job.id}, redirecting`);
      router.push(`/jobs/${data.job.id}`);
    } catch (err: any) {
      console.error("[jobs] unexpected error creating job:", err);
      const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const addHelper = () => {
    const newHelper: Helper = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      ratePerHour: "",
    };
    setFormData((prev) => ({
      ...prev,
      helpers: [...prev.helpers, newHelper],
    }));
  };

  const removeHelper = (helperId: string) => {
    setFormData((prev) => ({
      ...prev,
      helpers: prev.helpers.filter((h) => h.id !== helperId),
    }));
  };

  const updateHelper = (helperId: string, field: "name" | "ratePerHour", value: string) => {
    setFormData((prev) => ({
      ...prev,
      helpers: prev.helpers.map((h) =>
        h.id === helperId ? { ...h, [field]: value } : h
      ),
    }));
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/jobs"
                className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {isClient ? "Post a Job" : "Create Job Pack"}
                </h1>
                <p className="text-sm text-slate-500">
                  {isClient
                    ? "Post your requirements to tradies"
                    : "AI-powered scoping in seconds"}
                </p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="hidden sm:flex items-center gap-6">
              <ProgressStep step={1} label="Details" isActive={currentStep === 1} isComplete={step1Complete && currentStep > 1} />
              <div className="w-8 h-0.5 bg-slate-200" />
              <ProgressStep step={2} label="Scope" isActive={currentStep === 2} isComplete={step2Complete && currentStep > 2} />
              <div className="w-8 h-0.5 bg-slate-200" />
              <ProgressStep step={3} label="Pricing" isActive={currentStep === 3} isComplete={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Privacy Notice */}
          {!isClient && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Client Privacy First
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Client details are kept private and entered manually after job pack generation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Template Selector */}
          {!isClient && (
            <TemplateSelector
              onSelectTemplate={setSelectedTemplate}
              selectedTemplateId={selectedTemplate?.id || null}
            />
          )}

          {/* Project Details Section */}
          <SectionCard
            icon={<FileText className="w-5 h-5" />}
            title="Project Details"
            description="Basic information about the job"
          >
            <div className="space-y-5">
              <InputField label="Job Name" required>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onFocus={() => setCurrentStep(1)}
                  placeholder="e.g. 3x2 repaint – Baldivis"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  required
                  disabled={isLoading}
                />
              </InputField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Trade Type">
                  <select
                    name="tradeType"
                    value={formData.tradeType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                    disabled={isLoading}
                  >
                    <option value="Painter">Painter</option>
                    <option value="Plasterer">Plasterer</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Other">Other</option>
                  </select>
                </InputField>

                <InputField label="Type of Work" required>
                  <input
                    type="text"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    placeholder="e.g. Single-storey house"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                </InputField>
              </div>

              <InputField label="Property Address" optional hint="Include suburb and postcode for accurate estimates">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 123 Main St, Baldivis WA 6171"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>
              </InputField>
            </div>
          </SectionCard>

          {/* Job Scope Section */}
          <SectionCard
            icon={<Briefcase className="w-5 h-5" />}
            title="Job Scope"
            description="Describe the work in detail"
          >
            <div className="space-y-4">
              {/* Privacy Reminder */}
              {!isClient && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Privacy reminder:</span> Do not include personal information (names, emails, phone numbers) in the notes.
                    </p>
                  </div>
                </div>
              )}

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                onFocus={() => setCurrentStep(2)}
                rows={8}
                placeholder="Include as much detail as possible:
• Room list and sizes
• Current condition of surfaces
• Any prep work needed
• Specific colours or products
• Access considerations
• Timeline requirements"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                disabled={isLoading}
              />

              {/* Example Tips */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Pro Tips for Better Quotes
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    "1x bedroom 3x3m, walls currently off-white, light prep needed"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    "Ceilings 2.4m high, some cracking, needs patch and sand"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    "Skirtings and doors semi-gloss, minor scuffs"
                  </li>
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* Pricing Section - Only for tradies */}
          {!isClient && (
            <SectionCard
              icon={<DollarSign className="w-5 h-5" />}
              title="Pricing"
              description="Optional – helps generate accurate quotes"
            >
              <div className="space-y-5">
                <InputField
                  label="Your Labour Rate (ex GST)"
                  optional
                  hint={businessProfile?.hourlyRate ? `Your saved rate: $${businessProfile.hourlyRate}/hr` : "Set in Business Profile for auto-fill"}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      name="labourRatePerHour"
                      value={formData.labourRatePerHour}
                      onChange={handleChange}
                      onFocus={() => setCurrentStep(3)}
                      min="0"
                      step="1"
                      placeholder="50"
                      className="w-full pl-9 pr-16 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      disabled={isLoading}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/hour</span>
                  </div>
                </InputField>

                {/* Helpers Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Team Members</span>
                      <span className="text-xs text-slate-400">(optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={addHelper}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Helper
                    </button>
                  </div>

                  {formData.helpers.length > 0 ? (
                    <div className="space-y-3">
                      {formData.helpers.map((helper, index) => (
                        <div
                          key={helper.id}
                          className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Name / Role
                              </label>
                              <input
                                type="text"
                                value={helper.name}
                                onChange={(e) => updateHelper(helper.id, "name", e.target.value)}
                                placeholder="e.g., Apprentice"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Rate (ex GST)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                <input
                                  type="number"
                                  value={helper.ratePerHour}
                                  onChange={(e) => updateHelper(helper.id, "ratePerHour", e.target.value)}
                                  min="0"
                                  step="1"
                                  placeholder="40"
                                  className="w-full pl-8 pr-12 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                                  disabled={isLoading}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/hr</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeHelper(helper.id)}
                            className="mt-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isLoading}
                            title="Remove helper"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No team members added. Click "Add Helper" if you work with a team.
                    </p>
                  )}
                </div>

                {/* Materials Estimate Toggle */}
                <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="materialsAreRoughEstimate"
                    checked={formData.materialsAreRoughEstimate}
                    onChange={handleChange}
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    disabled={isLoading}
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      Mark materials as estimates
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Clearly state that material prices are approximate and should be verified with suppliers.
                    </p>
                  </div>
                </label>
              </div>
            </SectionCard>
          )}

          {/* Free Plan Banner */}
          {!isClient && planTier === "FREE" && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Free Pilot Access
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Generate job packs for free during the pilot. Premium features coming soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-center mb-4">
              <OvisBadge variant="card" size="sm" />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-slate-500 text-center sm:text-left">
                {isClient
                  ? "Your job will be visible to tradies in your area."
                  : "AI will generate a complete job pack with quote, scope & materials."}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/jobs"
                  className="flex-1 sm:flex-none px-5 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || !formData.title || !formData.propertyType}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Job Pack
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {isClient ? "Posting Your Job" : "Generating AI Job Pack"}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isClient
                ? "Your job post is being created. Tradies will be able to see it soon."
                : "Creating your professional quote, scope of work, and materials list. This usually takes 10-20 seconds."}
            </p>
            <div className="mt-6 flex justify-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
