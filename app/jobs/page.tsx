import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { getJobsForUser, type Job, type JobStatus, type JobWorkflowStatus, type ClientStatus } from "@/lib/jobs";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";

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

function JobWorkflowStatusBadge({ status }: { status: JobWorkflowStatus }) {
  const styles: Record<JobWorkflowStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    booked: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  const labels: Record<JobWorkflowStatus, string> = {
    pending: "Pending",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    declined: "bg-rose-100 text-rose-700",
    cancelled: "bg-amber-100 text-amber-700",
  };

  const labels: Record<ClientStatus, string> = {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    cancelled: "Cancelled",
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
    year: "numeric",
  });
}

function JobRow({ job }: { job: Job }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-slate-900 font-medium">{job.title}</span>
          {job.address && (
            <span className="text-slate-500 text-sm truncate max-w-xs">{job.address}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-600">{job.tradeType}</td>
      <td className="px-6 py-4">
        <JobWorkflowStatusBadge status={job.jobStatus || "pending"} />
      </td>
      <td className="px-6 py-4">
        <ClientStatusBadge status={job.clientStatus || "draft"} />
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-6 py-4 text-slate-600">{formatDate(job.createdAt)}</td>
      <td className="px-6 py-4">
        <Link
          href={`/jobs/${job.id}`}
          className="text-amber-600 hover:text-amber-700 font-medium text-sm"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

interface JobsPageProps {
  searchParams: Promise<{ removed?: string; error?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await requireActiveUser("/jobs");

  const jobs = await getJobsForUser(user.id);
  const params = await searchParams;
  const showRemovedNotice = params.removed === "true";
  const showErrorNotice = params.error === "job_removed";

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
            {jobs.length === 0
              ? "Create your first AI-powered job pack."
              : `You have ${jobs.length} job${jobs.length === 1 ? "" : "s"}.`}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trade
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Job Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    AI Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jobs.map((job) => <JobRow key={job.id} job={job} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
