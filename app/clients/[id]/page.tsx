import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireActiveUser, isClient, isAdmin } from "@/lib/auth";
import { getClientById, updateClient, getJobsForClient } from "@/lib/clientCrm";
import { formatDateTimeForDisplay } from "@/lib/format";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import ClientNotesForm from "./ClientNotesForm";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    ai_pending: "bg-amber-100 text-amber-700",
    ai_complete: "bg-green-100 text-green-700",
    ai_failed: "bg-red-100 text-red-700",
    pending_regeneration: "bg-orange-100 text-orange-700",
    generating: "bg-amber-100 text-amber-700",
    pending: "bg-blue-100 text-blue-700",
    booked: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    draft: "Draft",
    ai_pending: "Generating...",
    ai_complete: "Complete",
    ai_failed: "Failed",
    pending_regeneration: "Needs Update",
    generating: "Regenerating...",
    pending: "Pending",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {labels[status] || status}
    </span>
  );
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const user = await requireActiveUser(`/clients/${(await params).id}`);

  // Redirect clients away from CRM
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  const { id: clientId } = await params;

  // Load client - ensure it belongs to this user (or admin can see all)
  const client = await getClientById(clientId, user.id);
  
  if (!client) {
    // If not found, check if admin can see it
    if (isAdmin(user)) {
      const { prisma } = await import("@/lib/prisma");
      const adminClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!adminClient) {
        notFound();
      }
      // Admin can view but we'll use the adminClient
      // For now, redirect to not found - admins can access via owner's view
      notFound();
    } else {
      notFound();
    }
  }

  // Load jobs for this client
  const jobs = await getJobsForClient(client.id, client.email, user.id);

  // Calculate stats
  const totalJobs = jobs.length;
  const acceptedJobs = jobs.filter((j) => j.clientStatus === "accepted").length;
  const lastJob = jobs[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={user.verificationStatus || "unverified"} />

      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>
      </div>

      {/* Client Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            {client.company && (
              <p className="text-lg text-slate-600 mt-1">{client.company}</p>
            )}
          </div>
          {client.tags && (
            <div className="flex flex-wrap gap-1">
              {client.tags.split(",").map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {client.email && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <a
                href={`mailto:${client.email}`}
                className="text-sm text-slate-900 hover:text-amber-600 font-medium"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Phone</p>
              <a
                href={`tel:${client.phone}`}
                className="text-sm text-slate-900 hover:text-amber-600 font-medium"
              >
                {client.phone}
              </a>
            </div>
          )}
          {(client.suburb || client.state || client.postcode) && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Location</p>
              <p className="text-sm text-slate-900">
                {[client.suburb, client.state, client.postcode].filter(Boolean).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Internal Notes & Tags Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Internal Notes & Tags</h2>
          <p className="text-xs text-slate-500">
            Private notes and tags - not visible to the client
          </p>
        </div>
        <ClientNotesForm client={client} />
      </div>

      {/* Jobs List Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Job History</h2>
              <p className="text-sm text-slate-600 mt-1">
                {totalJobs === 0
                  ? "No jobs yet"
                  : `${totalJobs} ${totalJobs === 1 ? "job" : "jobs"} • ${acceptedJobs} accepted`}
                {lastJob && ` • Last job: ${formatDateTimeForDisplay(lastJob.createdAt)}`}
              </p>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs yet</h3>
            <p className="text-slate-500 mb-6">
              Jobs for this client will appear here once created.
            </p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
            >
              Create Job for This Client
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>{job.tradeType} • {job.propertyType}</span>
                      {job.address && (
                        <span className="text-slate-500">• {job.address}</span>
                      )}
                      <span>• {formatDateTimeForDisplay(job.createdAt)}</span>
                    </div>
                    {job.totalInclGst && (
                      <p className="text-sm font-medium text-slate-900 mt-2">
                        Total: ${job.totalInclGst.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col gap-2 flex-shrink-0">
                    {job.jobStatus && <StatusBadge status={job.jobStatus} />}
                    {job.clientStatus && <StatusBadge status={job.clientStatus} />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

