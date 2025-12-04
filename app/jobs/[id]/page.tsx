import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, type Job, type JobStatus } from "@/lib/jobs";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Type Definitions for Parsed AI Data
// ============================================================================

interface QuoteLineItem {
  description?: string;
  rate?: string;
  total?: string;
  cost?: string;
}

interface ParsedQuote {
  labour?: QuoteLineItem;
  materials?: QuoteLineItem;
  totalEstimate?: QuoteLineItem;
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
  };

  const labels: Record<JobStatus, string> = {
    draft: "Draft",
    ai_pending: "Generating...",
    ai_complete: "Complete",
    ai_failed: "Failed",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
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
                {parsedQuote.labour.rate && (
                  <p className="text-xs text-slate-500">Rate: {parsedQuote.labour.rate}</p>
                )}
                {parsedQuote.labour.total && (
                  <p className="text-lg font-semibold text-slate-900">{parsedQuote.labour.total}</p>
                )}
              </div>
            )}
            {parsedQuote.materials && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Materials</p>
                {parsedQuote.materials.description && (
                  <p className="text-sm text-slate-600 mb-2">{parsedQuote.materials.description}</p>
                )}
                {parsedQuote.materials.cost && (
                  <p className="text-lg font-semibold text-slate-900">{parsedQuote.materials.cost}</p>
                )}
              </div>
            )}
            {parsedQuote.totalEstimate && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Total Estimate</p>
                {parsedQuote.totalEstimate.description && (
                  <p className="text-sm text-amber-700 mb-2">{parsedQuote.totalEstimate.description}</p>
                )}
                {parsedQuote.totalEstimate.total && (
                  <p className="text-lg font-bold text-amber-900">{parsedQuote.totalEstimate.total}</p>
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

function MaterialsSection({ content }: { content?: string }) {
  if (!content) return null;

  let materials: MaterialItem[] | null = null;
  try {
    materials = JSON.parse(content);
  } catch {
    // Parse failed, will show fallback
  }

  return (
    <div className="border-b border-slate-200 pb-6">
      <SectionHeader
        title="Materials"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />
      <div className="pl-10">
        {materials && Array.isArray(materials) && materials.length > 0 ? (
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
        ) : (
          <pre className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {content}
          </pre>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <StatusBadge status={job.status} />
              </div>
              <div>
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
            </div>
          </div>
        </div>

        {/* Main Content - AI Job Pack */}
        <div className="lg:col-span-2">
          {job.status === "ai_pending" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Generating Job Pack</h3>
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
              <Link
                href="/jobs/new"
                className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </Link>
            </div>
          )}

          {job.status === "ai_complete" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">AI Generated Job Pack</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  Powered by AI
                </span>
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
                <MaterialsSection content={job.aiMaterials} />
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
