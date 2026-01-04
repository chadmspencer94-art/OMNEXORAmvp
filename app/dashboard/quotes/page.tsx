import Link from "next/link";
import { requireOnboardedUser } from "@/lib/authChecks";
import { getJobsForUser, type Job } from "@/lib/jobs";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import StructuredBadge from "@/app/components/StructuredBadge";
import { ArrowLeft } from "lucide-react";

export default async function QuotesPage() {
  const user = await requireOnboardedUser();
  
  // Load jobs with error handling
  let jobs: Job[] = [];
  try {
    jobs = await getJobsForUser(user.id);
  } catch (error) {
    console.error("Failed to load jobs:", error);
  }

  // Filter jobs with quotes
  const jobsWithQuotes = jobs.filter((j) => 
    j.clientStatus === "sent" || 
    j.clientStatus === "accepted" || 
    j.clientStatus === "declined" ||
    j.clientAcceptedAt || 
    j.clientDeclinedAt ||
    j.aiQuote
  );

  const acceptedQuotes = jobs.filter((j) => j.clientStatus === "accepted" || j.clientAcceptedAt);
  const pendingQuotes = jobs.filter((j) => j.clientStatus === "sent" && !j.clientAcceptedAt && !j.clientDeclinedAt);
  const declinedQuotes = jobs.filter((j) => j.clientStatus === "declined" || j.clientDeclinedAt);

  const verificationStatus = user.verificationStatus || "unverified";
  const isVerified = verificationStatus === "verified";
  const displayName = user.email.split("@")[0];

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
              Quotes
              {isVerified && <StructuredBadge />}
            </h1>
            <p className="mt-2 text-slate-600">
              Track all your quotes and client responses
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Accepted</p>
              <p className="text-2xl font-bold text-slate-900">{acceptedQuotes.length}</p>
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
              <p className="text-2xl font-bold text-slate-900">{pendingQuotes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500">Declined</p>
              <p className="text-2xl font-bold text-slate-900">{declinedQuotes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">All Quotes</h2>
        </div>
        <div className="p-6">
          {jobsWithQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No quotes yet</h3>
              <p className="text-slate-500 mb-6">Create a job pack to generate your first quote.</p>
              <Link
                href="/jobs/new"
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
              >
                Create New Job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobsWithQuotes.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block border border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-slate-900 font-medium mb-1">{job.title}</h3>
                      <p className="text-slate-600 text-sm mb-2">
                        {job.address || "No address provided"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.clientStatus === "accepted" || job.clientAcceptedAt ? "bg-green-100 text-green-700" :
                          job.clientStatus === "declined" || job.clientDeclinedAt ? "bg-red-100 text-red-700" :
                          job.clientStatus === "sent" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {job.clientStatus === "accepted" || job.clientAcceptedAt ? "Accepted" :
                           job.clientStatus === "declined" || job.clientDeclinedAt ? "Declined" :
                           job.clientStatus === "sent" ? "Pending" :
                           "Draft"}
                        </span>
                        {job.clientAcceptedAt && (
                          <span className="text-xs text-slate-500">
                            Accepted {new Date(job.clientAcceptedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

