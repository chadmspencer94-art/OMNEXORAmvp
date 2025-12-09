import Link from "next/link";
import { requireClientUser } from "@/lib/auth";
import { getJobsForClient, type Job, type ClientStatus } from "@/lib/jobs";

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    declined: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-100 text-slate-700",
  };

  const labels: Record<ClientStatus, string> = {
    draft: "Draft",
    sent: "Quote Sent",
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
  const hasJobPack = job.status === "ai_complete" && job.sentToClientAt;
  const clientStatus = (job.clientStatus || "draft") as ClientStatus;

  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <Link href={`/client/jobs/${job.id}`} className="text-slate-900 font-medium hover:text-amber-600 truncate block mb-1">
          {job.title}
        </Link>
        <p className="text-slate-500 text-sm">
          {job.address || "No address provided"} • {formatDate(job.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-4 ml-4">
        <ClientStatusBadge status={clientStatus} />
        {hasJobPack && (
          <Link
            href={`/client/jobs/${job.id}`}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            View Documents →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function ClientDashboardPage() {
  const user = await requireClientUser("/client/dashboard");

  // Get client's first name from email for greeting
  const firstName = user.email.split("@")[0] || "there";

  // Fetch jobs for this client
  const jobs = await getJobsForClient(user.email);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Hi, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}.
        </h1>
        <p className="text-lg text-slate-600 mb-6">
          Here are your job requests.
        </p>
        <Link
          href="/client/jobs/new"
          className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post a new job
        </Link>
      </div>

      {/* Job List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Your Job Requests</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No job requests yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Post your first job request and a tradie will review it and send you a quote.
            </p>
            <Link
              href="/client/jobs/new"
              className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Post a new job
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

