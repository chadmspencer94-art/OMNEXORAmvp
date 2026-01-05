import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireClientUser } from "@/lib/auth";
import { getJobById, type Job, type ClientStatus } from "@/lib/jobs";
import ClientJobPackView from "./ClientJobPackView";
import ClientAcceptanceForm from "./ClientAcceptanceForm";

// Authenticated page using requireClientUser - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

interface ClientJobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientJobDetailPage({ params }: ClientJobDetailPageProps) {
  // Await params (Next.js 16+ requires params to be a Promise)
  const { id } = await params;
  const user = await requireClientUser(`/client/jobs/${id}`);

  // Load the job
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  // Ensure this job belongs to this client
  const normalizedClientEmail = user.email.toLowerCase().trim();
  const jobClientEmail = job.clientEmail?.toLowerCase().trim();

  if (jobClientEmail !== normalizedClientEmail) {
    // Job doesn't belong to this client
    redirect(`/client/dashboard`);
  }

  const clientStatus = (job.clientStatus || "draft") as ClientStatus;
  const hasJobPack = job.status === "ai_complete" && job.sentToClientAt;
  const isAccepted = clientStatus === "accepted";
  const isDeclined = clientStatus === "declined";

  // Fetch the tradie's business profile for PDF exports
  let businessProfile: {
    legalName?: string;
    tradingName?: string;
    abn?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  } | null = null;
  
  try {
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    const tradieUser = await prisma.user.findFirst({
      where: { id: job.userId },
      select: {
        businessName: true,
        tradingName: true,
        abn: true,
        email: true,
        businessPhone: true,
        businessAddressLine1: true,
        businessAddressLine2: true,
        businessSuburb: true,
        businessState: true,
        businessPostcode: true,
      },
    });
    if (tradieUser?.businessName) {
      businessProfile = {
        legalName: tradieUser.businessName || undefined,
        tradingName: tradieUser.tradingName || undefined,
        abn: tradieUser.abn || undefined,
        email: tradieUser.email || undefined,
        phone: tradieUser.businessPhone || undefined,
        addressLine1: tradieUser.businessAddressLine1 || undefined,
        addressLine2: tradieUser.businessAddressLine2 || undefined,
        suburb: tradieUser.businessSuburb || undefined,
        state: tradieUser.businessState || undefined,
        postcode: tradieUser.businessPostcode || undefined,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch tradie business profile:", error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Job Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
            <p className="text-slate-600">
              {job.address || "No address provided"}
            </p>
          </div>
          <ClientStatusBadge status={clientStatus} />
        </div>

        {/* Schedule Information */}
        {(job.scheduledStartAt || job.scheduledEndAt) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Scheduled Date</p>
                {job.scheduledStartAt && job.scheduledEndAt ? (
                  <p className="text-sm text-blue-700">
                    {new Date(job.scheduledStartAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })} - {new Date(job.scheduledEndAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                ) : job.scheduledStartAt ? (
                  <p className="text-sm text-blue-700">
                    {new Date(job.scheduledStartAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
        {!job.scheduledStartAt && !job.scheduledEndAt && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-slate-600">
                  Job not scheduled yet – your tradie will confirm dates with you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quote Metadata */}
        {(job.quoteNumber || job.quoteExpiryAt) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-4 text-sm">
              {job.quoteNumber && (
                <div>
                  <span className="text-slate-500">Quote #:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {job.quoteNumber}
                    {job.quoteVersion ? ` v${job.quoteVersion}` : ""}
                  </span>
                </div>
              )}
              {job.quoteExpiryAt && (
                <div>
                  <span className="text-slate-500">Valid until:</span>{" "}
                  <span className={`font-medium ${
                    new Date(job.quoteExpiryAt) < new Date() && !isAccepted
                      ? "text-red-600"
                      : "text-slate-900"
                  }`}>
                    {formatDate(job.quoteExpiryAt)}
                    {new Date(job.quoteExpiryAt) < new Date() && !isAccepted && " (Expired)"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expired Quote Banner */}
        {job.quoteExpiryAt && 
         new Date(job.quoteExpiryAt) < new Date() && 
         !isAccepted && 
         !isDeclined && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  This quote has expired
                </p>
                <p className="text-sm text-red-800">
                  This quote expired on {formatDate(job.quoteExpiryAt)}. Please contact your tradie to get an updated job pack.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div>
            <p className="text-sm text-slate-500 mb-1">Property Type</p>
            <p className="text-slate-900 font-medium">{job.propertyType}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Created</p>
            <p className="text-slate-900 font-medium">{formatDate(job.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Job Description */}
      {job.notes && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Description</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{job.notes}</p>
        </div>
      )}

      {/* Job Pack / Documents Section */}
      {hasJobPack ? (
        <>
          {/* Full Job Pack View */}
          <ClientJobPackView job={job} businessProfile={businessProfile} />

          {/* Acceptance Form */}
          <ClientAcceptanceForm
            jobId={job.id}
            currentStatus={clientStatus}
            clientEmail={user.email}
            quoteExpiryAt={job.quoteExpiryAt}
            quoteNumber={job.quoteNumber}
            quoteVersion={job.quoteVersion}
            clientAcceptedAt={job.clientAcceptedAt}
            clientAcceptedByName={job.clientAcceptedByName}
            clientAcceptanceNote={job.clientAcceptanceNote}
            clientAcceptedQuoteVer={job.clientAcceptedQuoteVer}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Pack Status</h2>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-slate-900 font-medium mb-1">Your job pack is being prepared</p>
              <p className="text-slate-600 text-sm">
                A tradie will review your job request and send you a quote. You&apos;ll receive an email once it&apos;s ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Time (if set) */}
      {(job.scheduledStartAt || job.scheduledEndAt) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Scheduled Time</h2>
          <div className="space-y-2 text-slate-700">
            {job.scheduledStartAt && (
              <p>
                <span className="font-medium">Start:</span>{" "}
                {new Date(job.scheduledStartAt).toLocaleString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {job.scheduledEndAt && (
              <p>
                <span className="font-medium">End:</span>{" "}
                {new Date(job.scheduledEndAt).toLocaleString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

