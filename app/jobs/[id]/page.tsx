import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, type Job, type JobStatus, type JobWorkflowStatus, type AIReviewStatus, type ClientStatus } from "@/lib/jobs";
import CopyForClientButton from "./CopyForClientButton";
import EmailToClientButton from "./EmailToClientButton";
import RegenerateButton from "./RegenerateButton";
import JobStatusControl from "./JobStatusControl";
import AIReviewStatusControl from "./AIReviewStatusControl";
import ClientStatusControl from "./ClientStatusControl";
import SendToClientButton from "./SendToClientButton";
import JobPackPdfButton from "./JobPackPdfButton";
import MaterialsEditButton from "./MaterialsEditButton";
import DeleteJobButton from "./DeleteJobButton";
import VerifiedBadge from "@/app/components/VerifiedBadge";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import FeedbackButton from "@/app/components/FeedbackButton";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Type Definitions for Parsed AI Data
// ============================================================================

interface LabourQuote {
  description?: string;
  hours?: string;
  ratePerHour?: string;
  total?: string;
}

interface MaterialsQuote {
  description?: string;
  totalMaterialsCost?: string;
}

interface TotalEstimateQuote {
  description?: string;
  totalJobEstimate?: string;
}

interface ParsedQuote {
  labour?: LabourQuote;
  materials?: MaterialsQuote;
  totalEstimate?: TotalEstimateQuote;
}

interface MaterialItem {
  item: string;
  quantity?: string;
  estimatedCost?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
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

function AIReviewStatusBadge({ status }: { status: AIReviewStatus }) {
  const styles: Record<AIReviewStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
  };

  const labels: Record<AIReviewStatus, string> = {
    pending: "Pending review",
    confirmed: "Confirmed",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    declined: "bg-rose-100 text-rose-700",
    cancelled: "bg-amber-100 text-amber-700",
  };

  const labels: Record<ClientStatus, string> = {
    draft: "Draft",
    sent: "Sent to client",
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
  return new Date(dateString).toLocaleString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

// ============================================================================
// Section Components
// ============================================================================

function SummarySection({ content }: { content?: string }) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n|\n/).filter(p => p.trim());

  return (
    <div className="border-b border-slate-200 pb-6">
      <SectionHeader
        title="Summary"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />
      <div className="pl-10 space-y-2">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-700 leading-relaxed">{p}</p>
        ))}
      </div>
    </div>
  );
}

function PricingSection({ content }: { content?: string }) {
  if (!content) return null;

  let parsedQuote: ParsedQuote | null = null;
  try {
    parsedQuote = JSON.parse(content);
  } catch {
    // Parse failed, will show fallback
  }

  return (
    <div className="border-b border-slate-200 pb-6">
      <SectionHeader
        title="Pricing Snapshot"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <div className="pl-10">
        {parsedQuote ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {parsedQuote.labour && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Labour</p>
                {parsedQuote.labour.description && (
                  <p className="text-sm text-slate-600 mb-2">{parsedQuote.labour.description}</p>
                )}
                <div className="space-y-1">
                  {parsedQuote.labour.hours && (
                    <p className="text-xs text-slate-500">Hours: {parsedQuote.labour.hours}</p>
                  )}
                  {parsedQuote.labour.ratePerHour && (
                    <p className="text-xs text-slate-500">Rate: {parsedQuote.labour.ratePerHour}</p>
                  )}
                </div>
                {parsedQuote.labour.total && (
                  <p className="text-lg font-semibold text-slate-900 mt-2">{parsedQuote.labour.total}</p>
                )}
              </div>
            )}
            {parsedQuote.materials && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Materials</p>
                {parsedQuote.materials.description && (
                  <p className="text-sm text-slate-600 mb-2">{parsedQuote.materials.description}</p>
                )}
                {parsedQuote.materials.totalMaterialsCost && (
                  <p className="text-lg font-semibold text-slate-900 mt-2">{parsedQuote.materials.totalMaterialsCost}</p>
                )}
              </div>
            )}
            {parsedQuote.totalEstimate && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Total Estimate</p>
                {parsedQuote.totalEstimate.description && (
                  <p className="text-sm text-amber-700 mb-2">{parsedQuote.totalEstimate.description}</p>
                )}
                {parsedQuote.totalEstimate.totalJobEstimate && (
                  <p className="text-lg font-bold text-amber-900 mt-2">{parsedQuote.totalEstimate.totalJobEstimate}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <pre className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function ScopeSection({ content }: { content?: string }) {
  if (!content) return null;

  const lines = content.split("\n").filter(line => line.trim());

  return (
    <div className="border-b border-slate-200 pb-6">
      <SectionHeader
        title="Scope of Work"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        }
      />
      <div className="pl-10">
        {lines.length > 1 ? (
          <ol className="list-decimal list-inside space-y-2">
            {lines.map((line, i) => (
              <li key={i} className="text-slate-700 leading-relaxed">{line}</li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-700 leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  );
}

function ListSection({ 
  title, 
  content, 
  icon, 
  variant = "check" 
}: { 
  title: string; 
  content?: string; 
  icon: React.ReactNode;
  variant?: "check" | "x";
}) {
  if (!content) return null;

  const items = content.split("\n").filter(item => item.trim());
  if (items.length === 0) return null;

  return (
    <div className="border-b border-slate-200 pb-6">
      <SectionHeader title={title} icon={icon} />
      <div className="pl-10">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              {variant === "check" ? (
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-slate-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MaterialsSection({ 
  content, 
  overrideText,
  showRoughEstimateDisclaimer,
  editButton,
}: { 
  content?: string;
  overrideText?: string | null;
  showRoughEstimateDisclaimer?: boolean;
  editButton?: React.ReactNode;
}) {
  // If override text is present, show that instead of AI content
  const hasOverride = overrideText && overrideText.trim().length > 0;
  
  // Show disclaimer if rough estimate flag is set OR if there's no custom override
  const showDisclaimer = showRoughEstimateDisclaimer || !hasOverride;

  let materials: MaterialItem[] | null = null;
  if (content && !hasOverride) {
    try {
      materials = JSON.parse(content);
    } catch {
      // Parse failed, will show fallback
    }
  }

  // Don't render if no content and no override
  if (!content && !hasOverride) return null;

  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Materials"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        {editButton}
      </div>
      <div className="pl-10">
        {hasOverride ? (
          <>
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Final materials notes (overrides AI suggestion)
              </span>
            </div>
            <div className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
              {overrideText}
            </div>
          </>
        ) : materials && Array.isArray(materials) && materials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 font-medium text-slate-600">Item</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-600">Quantity</th>
                  <th className="text-right py-2 font-medium text-slate-600">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 text-slate-700">{mat.item}</td>
                    <td className="py-2 pr-4 text-slate-600">{mat.quantity || "—"}</td>
                    <td className="py-2 text-right text-slate-700 font-medium">{mat.estimatedCost || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : content ? (
          <pre className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {content}
          </pre>
        ) : null}

        {/* Materials disclaimer */}
        {showDisclaimer && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Note:</strong> Material prices are an estimate only and must be checked against current supplier pricing.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotesSection({ content }: { content?: string }) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n|\n/).filter(p => p.trim());

  return (
    <div className="pb-0">
      <SectionHeader
        title="Client Notes"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        }
      />
      <div className="pl-10 space-y-2">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-700 leading-relaxed">{p}</p>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=/jobs/${id}`);
  }

  const job = await getJobById(id);
  
  if (!job) {
    notFound();
  }

  // Security check - ensure user owns this job
  if (job.userId !== user.id) {
    redirect("/jobs");
  }

  // Handle deleted jobs - redirect to jobs list
  if (job.isDeleted === true) {
    redirect("/jobs?error=job_removed");
  }

  // Get verification status (with default for older users)
  const verificationStatus = user.verificationStatus || "unverified";
  const userRole = user.role || "tradie";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Verification Banner for unverified tradies */}
      {userRole === "tradie" && verificationStatus !== "verified" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-amber-800">
                {verificationStatus === "pending_review" 
                  ? "Verification in progress" 
                  : "Complete your business verification"}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {verificationStatus === "pending_review"
                  ? "Your verification is being reviewed. You'll be able to email job packs once approved."
                  : "Verify your business to display your \"Verified Trade\" badge and email job packs directly to clients."}
              </p>
              {verificationStatus !== "pending_review" && (
                <a
                  href="/settings/verification"
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                >
                  Complete verification
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
              <StatusBadge status={job.status} />
              <Link
                href={`/jobs/${job.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {job.tradeType}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {job.propertyType}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(job.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Job Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Information</h2>
            <div className="space-y-4">
              {/* Job Workflow Status */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Job Status</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <JobWorkflowStatusBadge status={job.jobStatus || "pending"} />
                </div>
                <div className="mt-2">
                  <JobStatusControl jobId={job.id} currentStatus={job.jobStatus || "pending"} />
                </div>
              </div>

              {/* AI Pack Review Status */}
              <div>
                <p className="text-sm text-slate-500 mb-1">AI Pack</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <AIReviewStatusBadge status={job.aiReviewStatus || "pending"} />
                </div>
                <div className="mt-2">
                  <AIReviewStatusControl jobId={job.id} currentStatus={job.aiReviewStatus || "pending"} />
                </div>
              </div>

              {/* Client Status */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Client Status</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <ClientStatusBadge status={job.clientStatus || "draft"} />
                  {(job.clientStatus || "draft") === "accepted" && (
                    <span className="text-xs text-emerald-600 font-medium">🎉 Won job!</span>
                  )}
                </div>
                {job.clientStatusUpdatedAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Updated: {formatDate(job.clientStatusUpdatedAt)}
                  </p>
                )}
                <div className="mt-2">
                  <ClientStatusControl jobId={job.id} currentStatus={job.clientStatus || "draft"} />
                </div>
              </div>

              {/* AI Generation Status */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-1">AI Generation</p>
                <StatusBadge status={job.status} />
              </div>

              {/* Client Details */}
              {(job.clientName || job.clientEmail) && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2 font-medium">Client</p>
                  {job.clientName && (
                    <p className="text-slate-900 font-medium">{job.clientName}</p>
                  )}
                  {job.clientEmail && (
                    <a
                      href={`mailto:${job.clientEmail}`}
                      className="text-amber-600 hover:text-amber-700 text-sm"
                    >
                      {job.clientEmail}
                    </a>
                  )}
                </div>
              )}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Trade Type</p>
                <p className="text-slate-900 font-medium">{job.tradeType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Property Type</p>
                <p className="text-slate-900 font-medium">{job.propertyType}</p>
              </div>
              {job.address && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Address</p>
                  <p className="text-slate-900 font-medium">{job.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500 mb-1">Created</p>
                <p className="text-slate-900 font-medium">{formatDate(job.createdAt)}</p>
              </div>
              {job.notes && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Your Notes</p>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{job.notes}</p>
                </div>
              )}

              {/* Business Status */}
              {userRole === "tradie" && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Business Status</p>
                  {verificationStatus === "verified" ? (
                    <VerifiedBadge />
                  ) : verificationStatus === "pending_review" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending
                    </span>
                  ) : verificationStatus === "rejected" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full border border-slate-200">
                      Not verified
                    </span>
                  )}
                </div>
              )}

              {/* Remove Job Action */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <DeleteJobButton jobId={job.id} />
                <div>
                  <FeedbackButton jobId={job.id} variant="compact" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - AI Job Pack */}
        <div className="lg:col-span-2">
          {(job.status === "ai_pending" || job.status === "generating") && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {job.status === "generating" ? "Regenerating Job Pack" : "Generating Job Pack"}
              </h3>
              <p className="text-slate-600">
                Our AI is creating your professional quote, scope of work, and materials list.
                This usually takes 10-20 seconds.
              </p>
            </div>
          )}

          {job.status === "ai_failed" && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Generation Failed</h3>
              <p className="text-slate-600 mb-6">
                We couldn&apos;t generate the AI job pack. This might be a temporary issue.
              </p>
              <RegenerateButton jobId={job.id} status={job.status} />
            </div>
          )}

          {(job.status === "ai_complete" || job.status === "pending_regeneration") && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              {/* Pending regeneration notice */}
              {job.status === "pending_regeneration" && (
                <div className="px-6 py-3 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-orange-700 font-medium">
                      Job details changed – regenerate to update the AI job pack.
                    </span>
                  </div>
                </div>
              )}
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">AI Generated Job Pack</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <RegenerateButton jobId={job.id} status={job.status} />
                  <CopyForClientButton
                    title={job.title}
                    address={job.address}
                    summary={job.aiSummary}
                    scopeOfWork={job.aiScopeOfWork}
                    inclusions={job.aiInclusions}
                    exclusions={job.aiExclusions}
                    quoteJson={job.aiQuote}
                  />
                  <EmailToClientButton
                    title={job.title}
                    clientEmail={job.clientEmail}
                    clientName={job.clientName}
                    address={job.address}
                    summary={job.aiSummary}
                    scopeOfWork={job.aiScopeOfWork}
                    inclusions={job.aiInclusions}
                    exclusions={job.aiExclusions}
                    quoteJson={job.aiQuote}
                    verificationStatus={user.verificationStatus || "unverified"}
                  />
                  <SendToClientButton
                    jobId={job.id}
                    jobTitle={job.title}
                    clientEmail={job.clientEmail}
                    clientName={job.clientName}
                    sentToClientAt={job.sentToClientAt}
                    verificationStatus={user.verificationStatus || "unverified"}
                  />
                  {/* Hint for draft status */}
                  {(!job.clientStatus || job.clientStatus === "draft") && (
                    <p className="text-xs text-slate-500 mt-1">
                      💡 Once you email the job pack, this job will move to &ldquo;Sent&rdquo; status.
                    </p>
                  )}
                  <JobPackPdfButton
                    jobId={job.id}
                    jobTitle={job.title}
                    jobCreatedAt={job.createdAt}
                    tradeType={job.tradeType}
                    propertyType={job.propertyType}
                    address={job.address}
                    clientName={job.clientName}
                    notes={job.notes}
                    aiSummary={job.aiSummary}
                    aiQuote={job.aiQuote}
                    aiScopeOfWork={job.aiScopeOfWork}
                    aiInclusions={job.aiInclusions}
                    aiExclusions={job.aiExclusions}
                    aiMaterials={job.aiMaterials}
                    aiClientNotes={job.aiClientNotes}
                    materialsOverrideText={job.materialsOverrideText}
                    materialsAreRoughEstimate={job.materialsAreRoughEstimate}
                  />
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    Powered by AI
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <SummarySection content={job.aiSummary} />
                <PricingSection content={job.aiQuote} />
                <ScopeSection content={job.aiScopeOfWork} />
                <ListSection
                  title="Inclusions"
                  content={job.aiInclusions}
                  variant="check"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                />
                <ListSection
                  title="Exclusions"
                  content={job.aiExclusions}
                  variant="x"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                />
                <MaterialsSection 
                  content={job.aiMaterials} 
                  overrideText={job.materialsOverrideText}
                  showRoughEstimateDisclaimer={job.materialsAreRoughEstimate}
                  editButton={
                    <MaterialsEditButton 
                      jobId={job.id} 
                      currentOverrideText={job.materialsOverrideText} 
                    />
                  }
                />
                <NotesSection content={job.aiClientNotes} />
              </div>
            </div>
          )}

          {job.status === "draft" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Draft Job</h3>
              <p className="text-slate-600">
                This job hasn&apos;t been processed by AI yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
