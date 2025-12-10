import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/authChecks";
import { getUsersByVerificationStatus } from "@/lib/auth";
import { getJobsForUser, type Job, type JobStatus } from "@/lib/jobs";
import { getUnresolvedFeedbackCount } from "@/lib/feedback";
import { formatDateTimeForDisplay } from "@/lib/format";
import DevVerifyButton from "./DevVerifyButton";
import VerifiedBadge from "@/app/components/VerifiedBadge";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import FeedbackButton from "@/app/components/FeedbackButton";
import MatchingJobsSection from "./MatchingJobsSection";
import GettingStartedCard from "./GettingStartedCard";
import OnboardingCard from "@/app/components/OnboardingCard";
import EmailVerificationBanner from "@/app/components/EmailVerificationBanner";
import AnalyticsSection from "./AnalyticsSection";
import { getOnboardingStatus } from "@/lib/onboarding-status";

// Authenticated page using requireOnboardedUser and Prisma - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Check if we're in development mode (for showing dev tools)
const isDev = process.env.NODE_ENV !== "production";

function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    ai_pending: "bg-amber-100 text-amber-700",
    ai_complete: "bg-green-100 text-green-700",
    ai_failed: "bg-red-100 text-red-700",
    pending_regeneration: "bg-orange-100 text-orange-700",
    generating: "bg-amber-100 text-amber-700",
  };

  const labels: Record<JobStatus, string> = {
    draft: "Draft",
    ai_pending: "Generating...",
    ai_complete: "Complete",
    ai_failed: "Failed",
    pending_regeneration: "Needs Update",
    generating: "Regenerating...",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function RecentJobRow({ job }: { job: Job }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <Link href={`/jobs/${job.id}`} className="text-slate-900 font-medium hover:text-amber-600 truncate block">
          {job.title}
        </Link>
        <p className="text-slate-500 text-sm">{job.tradeType} • {job.propertyType}</p>
      </div>
      <div className="flex items-center gap-4 ml-4">
        <StatusBadge status={job.status} />
        <span className="text-slate-500 text-sm">{formatDate(job.createdAt)}</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  
  console.log("[dashboard] starting page render for user", user?.id);

  // Redirect clients to their dashboard
  if (user.role === "client") {
    redirect("/client/dashboard");
  }
  
  // TypeScript: user is guaranteed to be non-client after redirect above
  const isClient = false;

  // Load user data from Prisma to get business profile fields
  // Use email to find user since KV and Prisma may use different IDs
  // Wrap in try-catch to handle database connection issues gracefully
  let prismaUser = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        role: true,
        businessName: true,
        tradingName: true,
        primaryTrade: true,
        abn: true,
        hourlyRate: true,
        serviceRadiusKm: true,
        servicePostcodes: true,
        verificationStatus: true,
        profileCompletedAt: true,
        emailVerifiedAt: true,
        onboardingDismissed: true,
        onboardingCompletedAt: true,
        // Fields needed for onboarding status computation
        calloutFee: true,
        ratePerM2Interior: true,
        ratePerM2Exterior: true,
        ratePerLmTrim: true,
        serviceAreaCity: true,
      },
    });
  } catch (error) {
    // Log error but don't crash - dashboard can still function without Prisma data
    console.error("[dashboard] Failed to load user data from Prisma:", error);
  }

  // Load jobs with error handling
  let jobs: Job[] = [];
  try {
    jobs = await getJobsForUser(user.id);
  } catch (error) {
    // Log error but don't crash - dashboard can still function without jobs
    console.error("Failed to load jobs:", error);
  }
  
  // Filter for client jobs (assigned via portal)
  const clientJobs = jobs.filter(
    (j) => j.leadSource === "CLIENT_PORTAL" && j.assignmentStatus === "ASSIGNED"
  );
  const newClientJobs = clientJobs
    .filter((j) => {
      // Show jobs that need attention (draft status or no AI pack yet)
      return j.status === "draft" || j.status === "ai_pending" || !j.aiSummary;
    })
    .slice(0, 5);
  
  // Calculate stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "ai_complete").length;
  const pendingJobs = jobs.filter((j) => j.status === "ai_pending").length;
  const recentJobs = jobs.slice(0, 5);
  const lastJob = jobs[0];

  // Get upcoming scheduled jobs (only for tradie/business users)
  // Note: Clients are already redirected above, so isClient is always false here
  const now = new Date();
  const upcomingJobs = !isClient
    ? jobs
        .filter((job) => {
          // Must have scheduledStartAt
          if (!job.scheduledStartAt) return false;
          // Must be in the future
          const startDate = new Date(job.scheduledStartAt);
          if (startDate <= now) return false;
          // Must not be cancelled
          if (job.jobStatus === "cancelled") return false;
          // Optionally exclude completed jobs
          if (job.jobStatus === "completed") return false;
          return true;
        })
        .sort((a, b) => {
          // Sort by scheduledStartAt ascending
          const aDate = new Date(a.scheduledStartAt!).getTime();
          const bDate = new Date(b.scheduledStartAt!).getTime();
          return aDate - bDate;
        })
        .slice(0, 10) // Limit to next 10
    : [];

  // Get display name from email
  const displayName = user.email.split("@")[0];

  // Get verification status and role (default values for older users)
  const verificationStatus = user.verificationStatus || "unverified";
  const userRole = user.role || "tradie";
  const isVerified = verificationStatus === "verified";
  const isTradie = userRole === "tradie";
  const userIsAdmin = user.isAdmin ?? false;

  // Get onboarding status (only for tradie/business users, not clients or admins)
  let onboardingStatus = null;
  if (prismaUser && !isClient && !userIsAdmin && prismaUser.role !== "client") {
    try {
      onboardingStatus = await getOnboardingStatus(prismaUser);
      // Don't show if all done or dismissed
      if (onboardingStatus.allDone || onboardingStatus.dismissed) {
        onboardingStatus = null;
      }
    } catch (error) {
      // Log error but don't crash - dashboard can still function without onboarding status
      console.error("Failed to load onboarding status:", error);
    }
  }

  // Get pending verification and feedback counts for admins
  let pendingVerifications = 0;
  let unresolvedFeedback = 0;
  if (userIsAdmin) {
    try {
      const pendingReviewUsers = await getUsersByVerificationStatus("pending");
      pendingVerifications = pendingReviewUsers.length;
      unresolvedFeedback = await getUnresolvedFeedbackCount();
    } catch {
      // Silently fail - don't break dashboard if admin query fails
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Email Verification Banner */}
      {prismaUser && !prismaUser.emailVerifiedAt && (
        <EmailVerificationBanner userEmail={user.email} />
      )}

      {/* Dev-only verify button */}
      {isDev && !isVerified && <DevVerifyButton />}

      {/* Verification Banner for unverified tradies (show after onboarding) */}
      {isTradie && !isVerified && prismaUser?.profileCompletedAt && (
        <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Nice work, your profile is set up.</p>
              <p className="mt-1 text-emerald-700">
                To build more trust with clients and unlock full OMNEXORA features, complete business verification.
                {(verificationStatus === "pending" || (verificationStatus as string) === "pending_review") ? (
                  <span className="ml-1 font-medium">Your verification is currently being reviewed.</span>
                ) : (
                  <a href="/settings/verification" className="ml-1 font-medium underline hover:text-emerald-900">
                    Review verification →
                  </a>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy verification banner for users who haven't completed onboarding yet */}
      {isTradie && !isVerified && !prismaUser?.profileCompletedAt && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Prototype mode</p>
              <p className="mt-1 text-amber-700">
                Your account is not fully verified yet. Before public launch, OMNEXORA will confirm your business details (ABN, insurance, ID) so clients know they&apos;re dealing with legitimate trades.
                {(verificationStatus === "pending" || (verificationStatus as string) === "pending_review") ? (
                  <span className="ml-1 font-medium">Your verification is currently being reviewed.</span>
                ) : (
                  <a href="/settings/verification" className="ml-1 font-medium underline hover:text-amber-900">
                    Complete business verification →
                  </a>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Onboarding Card */}
      {onboardingStatus && (
        <OnboardingCard
          steps={onboardingStatus.steps}
          allDone={onboardingStatus.allDone}
          onDismiss={() => {
            // This will be handled by the component's router.refresh()
          }}
        />
      )}

      {/* Legacy Getting Started Card (fallback for older logic) */}
      {!onboardingStatus && prismaUser && (
        <GettingStartedCard
          user={prismaUser}
          hasJobs={totalJobs > 0}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 flex-wrap">
            <span>G&apos;day, {displayName}! 👋</span>
            {isVerified && <VerifiedBadge />}
          </h1>
          <p className="mt-2 text-slate-600">
            {totalJobs === 0
              ? "Welcome to OMNEXORA! Create your first AI job pack to get started."
              : `You have ${totalJobs} job${totalJobs === 1 ? "" : "s"}. ${lastJob ? `Last job: "${lastJob.title}"` : ""}`}
          </p>
        </div>
        <div className="flex-shrink-0">
          <FeedbackButton />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Link
          href="/jobs/new"
          className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isTradie ? "Create New Job" : "Post a Job"}
        </Link>
      </div>

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Total Jobs</p>
              <p className="text-2xl font-bold text-slate-900">{totalJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completedJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{pendingJobs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Credits Left</p>
              <p className="text-2xl font-bold text-slate-900">∞</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Cards - Only shown for admins */}
      {userIsAdmin && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/verification"
            className="block bg-purple-50 rounded-xl border border-purple-200 p-5 shadow-sm hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">ADMIN</p>
                  <p className="text-lg font-bold text-purple-900">
                    {pendingVerifications} pending
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
          <Link
            href="/admin/feedback"
            className="block bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-amber-600">Feedback</p>
                  <p className="text-lg font-bold text-amber-900">
                    {unresolvedFeedback} unresolved
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Jobs</h2>
            <Link href="/jobs" className="text-sm font-medium text-amber-600 hover:text-amber-500">
              View all →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs yet</h3>
              <p className="text-slate-500 mb-6">Create your first AI job pack to get started.</p>
              <Link
                href="/jobs/new"
                className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Job
              </Link>
            </div>
          ) : (
            <div>
              {recentJobs.map((job) => (
                <RecentJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jobs in your service area - Only shown for tradies */}
      {isTradie && (
        <div className="mt-8">
          <MatchingJobsSection />
        </div>
      )}
    </div>
  );
}
