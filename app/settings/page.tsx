"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  DollarSign,
  Shield,
  FileText,
  Palette,
  Wrench,
  Zap,
  HardHat,
  Settings2,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  User,
  Briefcase,
  PenTool,
  ArrowLeft,
  Sparkles,
  LayoutGrid,
  Package,
  Home,
  Droplet,
  Hammer,
  Wind,
  Layers,
  TreeDeciduous,
} from "lucide-react";
import { featureFlags } from "@/lib/featureFlags";

interface UserData {
  email: string;
  emailVerifiedAt: string | null;
  verificationStatus: string | null;
  role: string | null;
  primaryTrade: string | null;
  businessName: string | null;
  hourlyRate: number | null;
  serviceRadiusKm: number | null;
  doesResidential: boolean;
  doesCommercial: boolean;
  doesStrata: boolean;
}

// Trade type icons and colors
const TRADE_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string; label: string }> = {
  Painter: {
    icon: <Palette className="w-5 h-5" />,
    color: "text-purple-600",
    gradient: "from-purple-500 to-indigo-600",
    label: "Painter",
  },
  Plasterer: {
    icon: <HardHat className="w-5 h-5" />,
    color: "text-orange-600",
    gradient: "from-orange-500 to-red-600",
    label: "Plasterer",
  },
  Carpenter: {
    icon: <Wrench className="w-5 h-5" />,
    color: "text-amber-600",
    gradient: "from-amber-500 to-orange-600",
    label: "Carpenter",
  },
  Electrician: {
    icon: <Zap className="w-5 h-5" />,
    color: "text-yellow-600",
    gradient: "from-yellow-500 to-amber-600",
    label: "Electrician",
  },
  Roofer: {
    icon: <Home className="w-5 h-5" />,
    color: "text-sky-600",
    gradient: "from-sky-500 to-blue-600",
    label: "Roofer",
  },
  Plumber: {
    icon: <Droplet className="w-5 h-5" />,
    color: "text-cyan-600",
    gradient: "from-cyan-500 to-teal-600",
    label: "Plumber",
  },
  Concreter: {
    icon: <Hammer className="w-5 h-5" />,
    color: "text-stone-600",
    gradient: "from-stone-500 to-zinc-600",
    label: "Concreter",
  },
  HVAC: {
    icon: <Wind className="w-5 h-5" />,
    color: "text-indigo-600",
    gradient: "from-indigo-500 to-violet-600",
    label: "HVAC Technician",
  },
  Flooring: {
    icon: <Layers className="w-5 h-5" />,
    color: "text-teal-600",
    gradient: "from-teal-500 to-emerald-600",
    label: "Flooring Installer",
  },
  Landscaper: {
    icon: <TreeDeciduous className="w-5 h-5" />,
    color: "text-lime-600",
    gradient: "from-lime-500 to-green-600",
    label: "Landscaper",
  },
  Other: {
    icon: <Briefcase className="w-5 h-5" />,
    color: "text-slate-600",
    gradient: "from-slate-500 to-slate-700",
    label: "Trade Professional",
  },
};

function getTradeConfig(trade: string | null) {
  return TRADE_CONFIG[trade || "Other"] || TRADE_CONFIG.Other;
}

// Quick action cards for each section
interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: React.ReactNode;
  accentColor?: string;
}

function QuickAction({ href, icon, title, description, badge, accentColor = "amber" }: QuickActionProps) {
  const colors: Record<string, string> = {
    amber: "group-hover:bg-amber-50 group-hover:border-amber-200",
    purple: "group-hover:bg-purple-50 group-hover:border-purple-200",
    emerald: "group-hover:bg-emerald-50 group-hover:border-emerald-200",
    blue: "group-hover:bg-blue-50 group-hover:border-blue-200",
  };

  return (
    <Link
      href={href}
      className={`group block p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${colors[accentColor]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-${accentColor}-100 flex items-center justify-center text-slate-600 group-hover:text-${accentColor}-600 transition-colors`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900 group-hover:text-slate-900">{title}</h3>
            {badge}
          </div>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>
    </Link>
  );
}

// Status badge component
function StatusBadge({ status, type }: { status: string; type: "email" | "business" }) {
  if (type === "email") {
    return status ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }

  // Business verification
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Verified
      </span>
    );
  }
  if (status === "pending" || status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        In Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <AlertCircle className="w-3 h-3" />
      Not Verified
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user settings
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.status === 401) {
          router.push("/login");
          return;
        }
        const settingsData = settingsRes.ok ? await settingsRes.json() : null;

        // Fetch business profile for trade info
        const profileRes = await fetch("/api/settings/business-profile");
        const profileData = profileRes.ok ? await profileRes.json() : null;

        setUserData({
          email: settingsData?.user?.email || "",
          emailVerifiedAt: settingsData?.user?.emailVerifiedAt || null,
          verificationStatus: settingsData?.user?.verificationStatus || null,
          role: settingsData?.user?.role || null,
          primaryTrade: profileData?.businessProfile?.primaryTrade || null,
          businessName: profileData?.businessProfile?.businessName || null,
          hourlyRate: profileData?.businessProfile?.hourlyRate || null,
          serviceRadiusKm: profileData?.businessProfile?.serviceRadiusKm || null,
          doesResidential: profileData?.businessProfile?.doesResidential ?? true,
          doesCommercial: profileData?.businessProfile?.doesCommercial ?? false,
          doesStrata: profileData?.businessProfile?.doesStrata ?? false,
        });
      } catch {
        console.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isClient = userData?.role === "client";
  const tradeConfig = getTradeConfig(userData?.primaryTrade ?? null);
  const profileComplete = userData?.businessName && userData?.hourlyRate;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Title Section with Trade Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {isClient ? "Profile Settings" : "Settings"}
              </h1>
              <p className="mt-1 text-slate-600">
                {isClient
                  ? "Manage your client profile and preferences"
                  : "Manage your business profile and preferences"}
              </p>
            </div>

            {/* Trade Badge - Only for tradies */}
            {!isClient && userData?.primaryTrade && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${tradeConfig.gradient} text-white shadow-lg`}>
                {tradeConfig.icon}
                <span className="font-medium">{tradeConfig.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Overview Card */}
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">
                  {userData?.businessName || userData?.email}
                </h2>
                <p className="text-sm text-slate-500 truncate">{userData?.email}</p>
              </div>
            </div>
          </div>

          {/* Status Row */}
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Email Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Email</span>
              </div>
              <StatusBadge status={userData?.emailVerifiedAt || ""} type="email" />
            </div>

            {/* Business Verification - Only for tradies */}
            {!isClient && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Business</span>
                </div>
                <StatusBadge status={userData?.verificationStatus || ""} type="business" />
              </div>
            )}

            {/* Profile Completion - Only for tradies */}
            {!isClient && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Profile</span>
                </div>
                {profileComplete ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    <Sparkles className="w-3 h-3" />
                    Setup Required
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Resend verification email - if not verified */}
          {!userData?.emailVerifiedAt && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/auth/send-verification-email", {
                      method: "POST",
                    });
                    if (response.ok) {
                      alert("Verification email sent! Check your inbox.");
                    } else {
                      const data = await response.json();
                      alert(data.error || "Failed to send verification email");
                    }
                  } catch {
                    alert("Failed to send verification email");
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-lg transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Grid - For Tradies */}
        {!isClient && (
          <>
            {/* Primary Settings */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-slate-400" />
                Business Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction
                  href="/settings/business-profile"
                  icon={<Building2 className="w-5 h-5" />}
                  title="Business Profile"
                  description="Business name, ABN, trade type, rates, and service area"
                  badge={!profileComplete ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      Setup
                    </span>
                  ) : undefined}
                  accentColor="amber"
                />
                <QuickAction
                  href="/settings/verification"
                  icon={<Shield className="w-5 h-5" />}
                  title="Verification"
                  description="Submit documents to verify your business and build trust"
                  badge={<StatusBadge status={userData?.verificationStatus || ""} type="business" />}
                  accentColor="emerald"
                />
              </div>
            </div>

            {/* Work Tools */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-slate-400" />
                Work Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickAction
                  href="/settings/templates"
                  icon={<FileText className="w-5 h-5" />}
                  title="Job Templates"
                  description="Create reusable templates for common job types"
                  accentColor="purple"
                />
                {featureFlags.showRateTemplates && (
                  <QuickAction
                    href="/settings/rates"
                    icon={<DollarSign className="w-5 h-5" />}
                    title="Rate Templates"
                    description="Save and reuse pricing structures for quotes"
                    accentColor="blue"
                  />
                )}
                {featureFlags.showMaterials && (
                  <QuickAction
                    href="/settings/materials"
                    icon={<Package className="w-5 h-5" />}
                    title="Materials Library"
                    description="Manage your materials and supplier pricing"
                    accentColor="amber"
                  />
                )}
                {featureFlags.showSignature && (
                  <QuickAction
                    href="/settings/signature"
                    icon={<PenTool className="w-5 h-5" />}
                    title="Digital Signature"
                    description="Set up your signature for documents"
                    accentColor="purple"
                  />
                )}
              </div>
            </div>

            {/* Trade-Specific Section */}
            {userData?.primaryTrade && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  {tradeConfig.icon}
                  <span className={tradeConfig.color}>{tradeConfig.label} Settings</span>
                </h2>

                {/* Painter-specific tips */}
                {userData.primaryTrade === "Painter" && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-2">Painter Rate Settings</h3>
                        <p className="text-sm text-purple-700 mb-3">
                          Configure your per-square-metre rates for walls, ceilings, and trim work in your Business Profile.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-purple-700">
                            Walls per m²
                          </span>
                          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-purple-700">
                            Ceilings per m²
                          </span>
                          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-purple-700">
                            Trim per lm
                          </span>
                          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-purple-700">
                            Doors each
                          </span>
                        </div>
                        <Link
                          href="/settings/business-profile"
                          className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-purple-700 hover:text-purple-800"
                        >
                          Configure painter rates
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Electrician-specific tips */}
                {userData.primaryTrade === "Electrician" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-yellow-900 mb-2">Electrician Rate Settings</h3>
                          <p className="text-sm text-yellow-700 mb-3">
                            Configure your callout fees, per-point rates, and hourly pricing for electrical work.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-yellow-700">
                              Callout fee
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-yellow-700">
                              Per point
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-yellow-700">
                              Hourly rate
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-yellow-700">
                              After hours
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-yellow-700 hover:text-yellow-800"
                          >
                            Configure electrician rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Electrical licensing & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        Licensing & Compliance (Critical)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">Licensed Work Only</span>
                          <p className="text-rose-600 text-xs mt-0.5">All electrical work requires license</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS/NZS 3000</span>
                          <p className="text-slate-500 text-xs mt-0.5">Wiring Rules compliance</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">Certificate of Compliance</span>
                          <p className="text-amber-600 text-xs mt-0.5">Required for notifiable work</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <span className="font-medium text-emerald-700">RCDs Mandatory</span>
                          <p className="text-emerald-600 text-xs mt-0.5">Safety switches on all circuits</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes CoC templates and compliance notes for all electrical documentation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Carpenter-specific tips */}
                {userData.primaryTrade === "Carpenter" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-900 mb-2">Carpenter Rate Settings</h3>
                          <p className="text-sm text-amber-700 mb-3">
                            Configure your rates for framing, decking, doors, flooring, and trim work.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-amber-700">
                              Day rate
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-amber-700">
                              Decking per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-amber-700">
                              Trim per lm
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-amber-700">
                              Door hang
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-amber-700 hover:text-amber-800"
                          >
                            Configure carpenter rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Carpentry standards & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600" />
                        Standards & Compliance
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 1684</span>
                          <p className="text-slate-500 text-xs mt-0.5">Timber-framed construction</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 1657</span>
                          <p className="text-slate-500 text-xs mt-0.5">Stairs & balustrades</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">H-Class Treatment</span>
                          <p className="text-amber-600 text-xs mt-0.5">H3 external, H4 in-ground</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <span className="font-medium text-emerald-700">Termite Management</span>
                          <p className="text-emerald-600 text-xs mt-0.5">AS 3660.1 requirements</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes timber grades, treatment requirements, and balustrade/stair compliance checks.
                      </p>
                    </div>
                  </div>
                )}

                {/* Plasterer-specific tips */}
                {userData.primaryTrade === "Plasterer" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                          <HardHat className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-orange-900 mb-2">Plasterer Rate Settings</h3>
                          <p className="text-sm text-orange-700 mb-3">
                            Configure your rates for plasterboard installation, repairs, and finishing work.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-orange-700">
                              Walls per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-orange-700">
                              Ceilings per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-orange-700">
                              Cornice per lm
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-orange-700">
                              Patch repairs
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-orange-700 hover:text-orange-800"
                          >
                            Configure plasterer rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Plastering compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-600" />
                        Australian Standards & Compliance
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS/NZS 2589</span>
                          <p className="text-slate-500 text-xs mt-0.5">Gypsum linings - Application & finishing</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 3740</span>
                          <p className="text-slate-500 text-xs mt-0.5">Waterproofing wet areas</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-700">Moisture-Resistant</span>
                          <p className="text-blue-600 text-xs mt-0.5">Required in bathrooms & wet areas</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg">
                          <span className="font-medium text-rose-700">Fire-Rated</span>
                          <p className="text-rose-600 text-xs mt-0.5">Required where FRL specified</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA automatically includes compliance notes in your documents based on job requirements.
                      </p>
                    </div>
                  </div>
                )}

                {/* Roofer-specific tips */}
                {userData.primaryTrade === "Roofer" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sky-900 mb-2">Roofer Rate Settings</h3>
                          <p className="text-sm text-sky-700 mb-3">
                            Configure your rates for metal roofing, tiles, guttering, and repair work.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-sky-700">
                              Metal per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-sky-700">
                              Tiles per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-sky-700">
                              Gutters per lm
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-sky-700">
                              Leak repairs
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-sky-700 hover:text-sky-800"
                          >
                            Configure roofer rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Roofing safety & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-sky-600" />
                        Safety & Compliance (Critical)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">Working at Heights</span>
                          <p className="text-rose-600 text-xs mt-0.5">Mandatory controls above 2m</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 1562.1</span>
                          <p className="text-slate-500 text-xs mt-0.5">Sheet roof & wall cladding</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">AS 3959</span>
                          <p className="text-amber-600 text-xs mt-0.5">Bushfire-prone areas (BAL)</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-700">Colorbond Warranty</span>
                          <p className="text-blue-600 text-xs mt-0.5">Up to 36 years when installed correctly</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes SWMS templates with working at heights controls and compliance notes for all roofing documents.
                      </p>
                    </div>
                  </div>
                )}

                {/* Plumber-specific tips */}
                {userData.primaryTrade === "Plumber" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 flex-shrink-0">
                          <Droplet className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-cyan-900 mb-2">Plumber Rate Settings</h3>
                          <p className="text-sm text-cyan-700 mb-3">
                            Configure your callout fees, per-fixture rates, and hourly pricing for plumbing work.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-cyan-700">
                              Callout fee
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-cyan-700">
                              Per fixture
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-cyan-700">
                              Hourly rate
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-cyan-700">
                              Emergency
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-cyan-700 hover:text-cyan-800"
                          >
                            Configure plumber rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Plumbing licensing & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-600" />
                        Licensing & Compliance (Critical)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">Licensed Work Only</span>
                          <p className="text-rose-600 text-xs mt-0.5">All plumbing requires license</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS/NZS 3500</span>
                          <p className="text-slate-500 text-xs mt-0.5">Plumbing & Drainage Code</p>
                        </div>
                        <div className="p-3 bg-cyan-50 rounded-lg">
                          <span className="font-medium text-cyan-700">WaterMark</span>
                          <p className="text-cyan-600 text-xs mt-0.5">Certified products required</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">TMV Required</span>
                          <p className="text-amber-600 text-xs mt-0.5">Tempering valves in bathrooms</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes compliance certificates and WaterMark verification for all plumbing documentation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Concreter-specific tips */}
                {userData.primaryTrade === "Concreter" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-stone-50 to-zinc-50 rounded-xl border border-stone-200 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 flex-shrink-0">
                          <Hammer className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-900 mb-2">Concreter Rate Settings</h3>
                          <p className="text-sm text-stone-700 mb-3">
                            Configure your per-m² rates for slabs, driveways, and decorative finishes.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-stone-700">
                              Slab per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-stone-700">
                              Driveway per m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-stone-700">
                              Exposed agg.
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-stone-700">
                              Footings per m³
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-stone-700 hover:text-stone-800"
                          >
                            Configure concreter rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Concrete standards & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-stone-600" />
                        Standards & Compliance
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 3600</span>
                          <p className="text-slate-500 text-xs mt-0.5">Concrete structures</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 2870</span>
                          <p className="text-slate-500 text-xs mt-0.5">Residential slabs & footings</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">Site Classification</span>
                          <p className="text-amber-600 text-xs mt-0.5">A, S, M, H1, H2, E, P ratings</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">Cement Burns</span>
                          <p className="text-rose-600 text-xs mt-0.5">PPE essential - caustic material</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes concrete grade specifications, reinforcement schedules, and site classification notes.
                      </p>
                    </div>
                  </div>
                )}

                {/* HVAC-specific tips */}
                {userData.primaryTrade === "HVAC" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Wind className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-indigo-900 mb-2">HVAC Rate Settings</h3>
                          <p className="text-sm text-indigo-700 mb-3">
                            Configure your installation rates, service charges, and equipment pricing.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-indigo-700">
                              Split install
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-indigo-700">
                              Service rate
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-indigo-700">
                              Pipework/m
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-indigo-700">
                              Ducted
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                          >
                            Configure HVAC rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* ARC Licensing & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        ARC Licensing & Compliance (Critical)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">ARC License Required</span>
                          <p className="text-rose-600 text-xs mt-0.5">Refrigerant handling mandatory</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS/NZS 5149</span>
                          <p className="text-slate-500 text-xs mt-0.5">Refrigeration systems safety</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <span className="font-medium text-indigo-700">GEMS Registration</span>
                          <p className="text-indigo-600 text-xs mt-0.5">Energy efficiency compliance</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">Annual Reporting</span>
                          <p className="text-amber-600 text-xs mt-0.5">Refrigerant usage to ARC</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes ARC license details on all documentation and refrigerant usage tracking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Flooring-specific tips */}
                {userData.primaryTrade === "Flooring" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-teal-900 mb-2">Flooring Rate Settings</h3>
                          <p className="text-sm text-teal-700 mb-3">
                            Configure your per-m² rates for timber, laminate, vinyl, carpet, and tiles.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-teal-700">
                              Timber/m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-teal-700">
                              LVP/m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-teal-700">
                              Carpet/m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-teal-700">
                              Sand &amp; polish
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-teal-700 hover:text-teal-800"
                          >
                            Configure flooring rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Flooring standards & compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-teal-600" />
                        Standards & Compliance
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">AS 1884 / AS 2455</span>
                          <p className="text-slate-500 text-xs mt-0.5">Flooring installation standards</p>
                        </div>
                        <div className="p-3 bg-teal-50 rounded-lg">
                          <span className="font-medium text-teal-700">AS 4586 Slip Rating</span>
                          <p className="text-teal-600 text-xs mt-0.5">P/R ratings for wet areas</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">Moisture Testing</span>
                          <p className="text-amber-600 text-xs mt-0.5">Required before concrete install</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">Asbestos Check</span>
                          <p className="text-rose-600 text-xs mt-0.5">Test old flooring pre-1990</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes slip ratings, expansion gap requirements, and subfloor prep notes for all flooring documentation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Landscaper-specific tips */}
                {userData.primaryTrade === "Landscaper" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-xl border border-lime-100 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-lime-100 flex items-center justify-center text-lime-600 flex-shrink-0">
                          <TreeDeciduous className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lime-900 mb-2">Landscaper Rate Settings</h3>
                          <p className="text-sm text-lime-700 mb-3">
                            Configure your per-m² rates for paving, turf, retaining walls, and planting.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-lime-700">
                              Paving/m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-lime-700">
                              Turf/m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-lime-700">
                              Retaining/m²
                            </span>
                            <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-lime-700">
                              Irrigation
                            </span>
                          </div>
                          <Link
                            href="/settings/business-profile"
                            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-lime-700 hover:text-lime-800"
                          >
                            Configure landscaper rates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Landscaping compliance info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-lime-600" />
                        Compliance & Approvals
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                          <span className="font-medium text-rose-700">Pool Fence AS 1926.1</span>
                          <p className="text-rose-600 text-xs mt-0.5">1200mm min, self-closing gate</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium text-amber-700">Retaining Walls</span>
                          <p className="text-amber-600 text-xs mt-0.5">Engineering &gt;600-1000mm</p>
                        </div>
                        <div className="p-3 bg-lime-50 rounded-lg">
                          <span className="font-medium text-lime-700">Tree Removal Permits</span>
                          <p className="text-lime-600 text-xs mt-0.5">Check local council rules</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-700">Dial Before You Dig</span>
                          <p className="text-blue-600 text-xs mt-0.5">Mandatory before excavation</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        OMNEXORA includes pool fence compliance checks, retaining wall approval guidance, and council permit notes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Generic trade tips for "Other" */}
                {userData.primaryTrade === "Other" && (
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200 p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Custom Rate Settings</h3>
                        <p className="text-sm text-slate-600 mb-3">
                          Set up your hourly rates, day rates, and custom pricing for your trade.
                        </p>
                        <Link
                          href="/settings/business-profile"
                          className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-slate-700 hover:text-slate-800"
                        >
                          Configure rates
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Service Area Summary */}
            {(userData?.serviceRadiusKm || userData?.doesResidential || userData?.doesCommercial || userData?.doesStrata) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  Service Area
                </h2>
                <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                  <div className="flex flex-wrap gap-3">
                    {userData.serviceRadiusKm && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700 font-medium">{userData.serviceRadiusKm}km radius</span>
                      </div>
                    )}
                    {userData.doesResidential && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Residential</span>
                      </div>
                    )}
                    {userData.doesCommercial && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-sm">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-purple-700 font-medium">Commercial</span>
                      </div>
                    )}
                    {userData.doesStrata && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg text-sm">
                        <CheckCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 font-medium">Strata</span>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/settings/business-profile"
                    className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    Update service area
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Client View */}
        {isClient && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Settings</h2>
            <p className="text-slate-600 mb-6">
              As a client, you can manage your account settings and view quotes from tradies.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">Email Address</h3>
                    <p className="text-sm text-slate-500">{userData?.email}</p>
                  </div>
                  <StatusBadge status={userData?.emailVerifiedAt || ""} type="email" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Need help?{" "}
            <a href="mailto:support@omnexora.com.au" className="text-amber-600 hover:text-amber-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
