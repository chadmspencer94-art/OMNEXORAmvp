"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Send,
  DollarSign,
  Shield,
  MessageSquare,
  Settings,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Zap,
  Target,
  BarChart3,
  ArrowUpRight,
  MapPin,
  Loader2,
  Bell,
  Check,
  Circle,
  X,
} from "lucide-react";

// Types
interface UserData {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  verificationStatus: string | null;
  role: string | null;
  isAdmin: boolean;
  businessName: string | null;
  tradingName: string | null;
  primaryTrade: string | null;
  profileCompletedAt: string | null;
  onboardingDismissed: boolean;
}

interface JobData {
  id: string;
  title: string;
  status: string;
  address: string | null;
  createdAt: string;
  clientStatus: string | null;
  jobStatus: string | null;
  scheduledStartAt: string | null;
}

interface Analytics {
  totalJobs: number;
  jobsLast30Days: number;
  jobsLast7Days: number;
  quoteCounts: {
    draft: number;
    sent: number;
    accepted: number;
    declined: number;
    cancelled: number;
  };
  variationMetrics: {
    totalVariationCost: number;
    variationCount: number;
    jobsWithVariations: number;
    avgVariationCost: number;
  };
}

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

interface AdminStats {
  pendingVerifications: number;
  unresolvedFeedback: number;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ai_complete: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Complete" },
    ai_pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Generating..." },
    draft: { bg: "bg-slate-100", text: "text-slate-600", label: "Draft" },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// Stat card component - mobile-first design with visible icons
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color = "blue",
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  color?: "blue" | "emerald" | "amber" | "purple" | "slate";
  href?: string;
}) {
  const colorConfig = {
    blue: { 
      bg: "bg-gradient-to-br from-blue-500 to-indigo-500", 
      icon: "text-white", 
      border: "hover:border-blue-300" 
    },
    emerald: { 
      bg: "bg-gradient-to-br from-emerald-500 to-teal-500", 
      icon: "text-white", 
      border: "hover:border-emerald-300" 
    },
    amber: { 
      bg: "bg-gradient-to-br from-amber-500 to-orange-500", 
      icon: "text-white", 
      border: "hover:border-amber-300" 
    },
    purple: { 
      bg: "bg-gradient-to-br from-purple-500 to-violet-500", 
      icon: "text-white", 
      border: "hover:border-purple-300" 
    },
    slate: { 
      bg: "bg-gradient-to-br from-slate-600 to-slate-700", 
      icon: "text-white", 
      border: "hover:border-slate-400" 
    },
  };
  const c = colorConfig[color];
  
  const content = (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-all ${href ? `${c.border} cursor-pointer hover:shadow-md` : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 ${c.bg} rounded-xl shadow-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900">{value}</p>
            {trend && trendValue && (
              <span className={`text-xs font-medium ${
                trend === "up" ? "text-emerald-600" : 
                trend === "down" ? "text-red-600" : "text-slate-400"
              }`}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            )}
          </div>
        </div>
        {href && <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 hidden md:block" />}
      </div>
    </div>
  );
  
  return href ? <Link href={href}>{content}</Link> : content;
}

// Quick action button
function QuickAction({
  icon: Icon,
  label,
  href,
  color = "slate",
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color?: "amber" | "slate" | "purple" | "emerald";
}) {
  const colors = {
    amber: "bg-amber-500 hover:bg-amber-400 text-slate-900",
    slate: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

// Job card component
function JobCard({ job }: { job: JobData }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 group-hover:text-amber-600 truncate transition-colors">
          {job.title}
        </p>
        <p className="text-sm text-slate-500 truncate">
          {job.address || "No address"} • {new Date(job.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </p>
      </div>
      <StatusBadge status={job.status} />
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// Onboarding progress component
function OnboardingProgress({ 
  steps, 
  onDismiss,
  isDismissing 
}: { 
  steps: OnboardingStep[]; 
  onDismiss: () => void;
  isDismissing: boolean;
}) {
  const completedSteps = steps.filter((s) => s.done).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full blur-3xl" />
      </div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Getting Started
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {completedSteps === steps.length 
                ? "All done! You're ready to go." 
                : `${completedSteps} of ${steps.length} complete`}
            </p>
          </div>
          <button
            onClick={onDismiss}
            disabled={isDismissing}
            className="p-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-slate-700 rounded-full mb-5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done ? "bg-emerald-500" : "bg-slate-700"
              }`}>
                {step.done ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Circle className="w-3 h-3 text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "text-slate-400 line-through" : "text-white"}`}>
                  {step.label}
                </p>
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Start →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Admin panel component
function AdminPanel({ stats }: { stats: AdminStats }) {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 sm:p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-purple-200" />
        <h3 className="text-lg font-semibold">Admin Panel</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/verification"
          className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors"
        >
          <p className="text-3xl font-bold">{stats.pendingVerifications}</p>
          <p className="text-sm text-purple-200 mt-1">Pending Reviews</p>
        </Link>
        <Link
          href="/admin/feedback"
          className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors"
        >
          <p className="text-3xl font-bold">{stats.unresolvedFeedback}</p>
          <p className="text-sm text-purple-200 mt-1">Feedback Items</p>
        </Link>
      </div>
      
      <Link
        href="/admin/dashboard"
        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
      >
        <BarChart3 className="w-4 h-4" />
        View Full Dashboard
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// Quote breakdown component
function QuoteBreakdown({ counts }: { counts: Analytics["quoteCounts"] }) {
  const total = counts.draft + counts.sent + counts.accepted + counts.declined + counts.cancelled;
  if (total === 0) return null;
  
  const items = [
    { label: "Draft", value: counts.draft, color: "bg-slate-400" },
    { label: "Sent", value: counts.sent, color: "bg-amber-500" },
    { label: "Accepted", value: counts.accepted, color: "bg-emerald-500" },
    { label: "Declined", value: counts.declined, color: "bg-red-500" },
  ].filter((i) => i.value > 0);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Quote Status</h3>
      
      {/* Progress bar */}
      <div className="h-3 bg-slate-100 rounded-full mb-4 overflow-hidden flex">
        {items.map((item) => (
          <div
            key={item.label}
            className={`h-full ${item.color} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(item.value / total) * 100}%` }}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-slate-600">{item.label}</span>
            <span className="text-xs font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [user, setUser] = useState<UserData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  
  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch user data
        const userRes = await fetch("/api/me");
        if (!userRes.ok) {
          if (userRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user data");
        }
        const userData = await userRes.json();
        setUser(userData);
        
        // Redirect clients
        if (userData.role === "client") {
          router.push("/client/dashboard");
          return;
        }
        
        // Fetch jobs
        const jobsRes = await fetch("/api/jobs?limit=5");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
        
        // Fetch analytics
        const analyticsRes = await fetch("/api/me/analytics");
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
        
        // Fetch onboarding status
        const onboardingRes = await fetch("/api/onboarding/status");
        if (onboardingRes.ok) {
          const onboardingData = await onboardingRes.json();
          if (!onboardingData.allDone && !onboardingData.dismissed) {
            setOnboardingSteps(onboardingData.steps || []);
            setShowOnboarding(true);
          }
        }
        
        // Fetch admin stats if admin
        if (userData.isAdmin) {
          const adminRes = await fetch("/api/admin/stats");
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            setAdminStats(adminData);
          }
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [router]);
  
  // Dismiss onboarding
  const handleDismissOnboarding = async () => {
    setIsDismissing(true);
    try {
      await fetch("/api/me/onboarding/dismiss", { method: "POST" });
      setShowOnboarding(false);
    } catch (err) {
      console.error("Failed to dismiss onboarding:", err);
    } finally {
      setIsDismissing(false);
    }
  };
  
  // Calculate stats
  const totalJobs = analytics?.totalJobs || jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "ai_complete").length;
  const pendingJobs = jobs.filter((j) => j.status === "ai_pending").length;
  const acceptedQuotes = analytics?.quoteCounts.accepted || 0;
  const sentQuotes = analytics?.quoteCounts.sent || 0;
  
  // Display name
  const displayName = user?.businessName || user?.tradingName || user?.email?.split("@")[0] || "there";
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Email verification banner */}
      {user && !user.emailVerifiedAt && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Please verify your email</p>
              <p className="text-amber-700 mt-1">
                Check your inbox for a verification link to activate your account.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              G'day, {displayName}! 👋
            </h1>
            <p className="mt-1 text-slate-500 text-sm sm:text-base">
              {totalJobs === 0
                ? "Welcome to OMNEXORA! Create your first job pack to get started."
                : `You have ${totalJobs} job${totalJobs === 1 ? "" : " packs"}. Let's keep the momentum going.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <QuickAction icon={Plus} label="New Job Pack" href="/jobs/new" color="amber" />
        <QuickAction icon={FileText} label="All Jobs" href="/jobs" />
        <QuickAction icon={Users} label="Clients" href="/clients" />
        <QuickAction icon={BarChart3} label="Analytics" href="/dashboard/analytics" color="purple" />
        <QuickAction icon={Calendar} label="Calendar" href="/calendar" />
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Stats & Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={FileText}
              label="Total Jobs"
              value={totalJobs}
              color="blue"
              href="/jobs"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={completedJobs}
              color="emerald"
            />
            <StatCard
              icon={Send}
              label="Sent"
              value={sentQuotes}
              color="amber"
            />
            <StatCard
              icon={Target}
              label="Accepted"
              value={acceptedQuotes}
              color="purple"
            />
          </div>
          
          {/* Quote breakdown */}
          {analytics && <QuoteBreakdown counts={analytics.quoteCounts} />}
          
          {/* Recent Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900">Recent Jobs</h2>
              </div>
              <Link 
                href="/jobs" 
                className="text-sm font-medium text-amber-600 hover:text-amber-500 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-4 sm:p-5">
              {jobs.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs yet</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                    Create your first AI-powered job pack to streamline your quoting process.
                  </p>
                  <Link
                    href="/jobs/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25"
                  >
                    <Plus className="w-4 h-4" />
                    Create Job Pack
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Onboarding & Admin */}
        <div className="space-y-6">
          {/* Onboarding */}
          {showOnboarding && onboardingSteps.length > 0 && (
            <OnboardingProgress 
              steps={onboardingSteps} 
              onDismiss={handleDismissOnboarding}
              isDismissing={isDismissing}
            />
          )}
          
          {/* Admin Panel */}
          {user?.isAdmin && adminStats && (
            <AdminPanel stats={adminStats} />
          )}
          
          {/* Quick Links Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link
                href="/settings/business-profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">Business Profile</p>
                  <p className="text-xs text-slate-500">Update your details</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/settings/rates"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">Pricing & Rates</p>
                  <p className="text-xs text-slate-500">Configure your rates</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/settings/verification"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-purple-600 transition-colors">Verification</p>
                  <p className="text-xs text-slate-500">Verify your business</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
          
          {/* Pro Tip Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Pro Tip</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Complete your business profile to enjoy a more streamlined and more precise documentation experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
