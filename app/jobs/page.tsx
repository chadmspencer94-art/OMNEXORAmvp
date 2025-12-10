import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { requireOnboardedUser } from "@/lib/authChecks";
import { getJobsForUserPaginated } from "@/lib/jobs";
import { buildPagination } from "@/lib/pagination";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import JobsList from "./JobsList";

// Authenticated page using requireOnboardedUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

interface JobsPageProps {
  searchParams: Promise<{ removed?: string; error?: string; page?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await requireOnboardedUser();
  
  console.log("[jobs] starting page render for user", user?.id);

  // Redirect clients to their dashboard
  if (user.role === "client") {
    redirect("/client/dashboard");
  }

  const params = await searchParams;
  const { page } = buildPagination(params.page, 20);
  const showRemovedNotice = params.removed === "true";
  const showErrorNotice = params.error === "job_removed";

  let jobsResult: Awaited<ReturnType<typeof getJobsForUserPaginated>>;
  try {
    jobsResult = await getJobsForUserPaginated(user.id, false, page, 20);
  } catch (error) {
    console.error("[jobs] Error fetching jobs:", error);
    // Return empty result instead of crashing
    jobsResult = {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: page,
      pageSize: 20,
    };
  }
  const jobs = jobsResult.items;

  // Get verification status for header
  const verificationStatus = user.verificationStatus || "unverified";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Job removed notification */}
      {showRemovedNotice && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">Job removed successfully</p>
            <p className="text-sm text-green-700 mt-1">
              The job has been removed from your list. The data is preserved internally.
            </p>
          </div>
        </div>
      )}

      {/* Tried to access removed job notification */}
      {showErrorNotice && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Job not available</p>
            <p className="text-sm text-amber-700 mt-1">
              The job you tried to access has been removed from your list.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="mt-2 text-slate-600">
            {jobsResult.totalItems === 0
              ? "Create your first AI-powered job pack."
              : `You have ${jobsResult.totalItems} job${jobsResult.totalItems === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Job</span>
          </Link>
        </div>
      </div>

      {/* Empty State or Jobs Table */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
            <ClipboardList className="h-7 w-7 text-slate-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No jobs yet</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            Create your first AI-powered job pack to scope a project in seconds instead of hours.
          </p>
          <Link
            href="/jobs/new"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create your first job</span>
          </Link>
        </div>
      ) : (
        <JobsList jobs={jobs} pagination={jobsResult} />
      )}
    </div>
  );
}
