import Link from "next/link";
import { requireOnboardedUser } from "@/lib/authChecks";
import { getJobsForUser, type Job } from "@/lib/jobs";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import VerifiedBadge from "@/app/components/VerifiedBadge";
import AnalyticsSection from "../AnalyticsSection";
import { ArrowLeft } from "lucide-react";

export default async function PerformancePage() {
  const user = await requireOnboardedUser();
  
  // Load jobs with error handling
  let jobs: Job[] = [];
  try {
    jobs = await getJobsForUser(user.id);
  } catch (error) {
    console.error("Failed to load jobs:", error);
  }

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "ai_complete").length;
  const pendingJobs = jobs.filter((j) => j.status === "ai_pending").length;
  const acceptedQuotes = jobs.filter((j) => j.clientStatus === "accepted" || j.clientAcceptedAt).length;
  const totalQuotes = jobs.filter((j) => 
    j.clientStatus === "sent" || 
    j.clientStatus === "accepted" || 
    j.clientStatus === "declined" ||
    j.clientAcceptedAt || 
    j.clientDeclinedAt
  ).length;
  const winRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

  const verificationStatus = user.verificationStatus || "unverified";
  const isVerified = verificationStatus === "verified";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              Performance
              {isVerified && <VerifiedBadge />}
            </h1>
            <p className="mt-2 text-slate-600">
              Analytics and job completion metrics
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Performance Metrics */}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Win Rate</p>
              <p className="text-2xl font-bold text-slate-900">{winRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

