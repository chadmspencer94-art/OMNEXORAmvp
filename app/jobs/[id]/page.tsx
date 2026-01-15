import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requireActiveUser, isAdmin } from "@/lib/auth";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { getJobById, type Job, type JobStatus, type JobWorkflowStatus, type AIReviewStatus, type ClientStatus, type EffectiveRates } from "@/lib/jobs";
import type { UserRole } from "@/lib/auth";
import { formatEffectiveRatesForDisplay, calculateEstimateRange } from "@/lib/pricing";
import { formatDateTimeForDisplay } from "@/lib/format";
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
import SectionEditButton from "./SectionEditButton";
import SpecDocButton from "./SpecDocButton";
import JobDocumentsSection from "./JobDocumentsSection";
import SafetySection from "./SafetySection";
import ClientQuoteReview from "./ClientQuoteReview";
import ClientSignatureStatus from "./ClientSignatureStatus";
import ClientSignatureDisplay from "./ClientSignatureDisplay";
import DuplicateJobButton from "./DuplicateJobButton";
import SaveAsTemplateButton from "./SaveAsTemplateButton";
import ClientDetailsEntry from "./ClientDetailsEntry";
import QuoteHistoryPanel from "./QuoteHistoryPanel";
import ScheduleSection from "./ScheduleSection";
import SuggestedTradiesPanel from "./SuggestedTradiesPanel";
import JobAssignmentPanel from "./JobAssignmentPanel";
import MaterialsManagementSection from "./MaterialsManagementSection";
import AttachmentsSection from "./AttachmentsSection";
import VerifiedBadge from "@/app/components/StructuredBadge";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import FeedbackButton from "@/app/components/FeedbackButton";
import AIWarningBanner from "@/app/components/AIWarningBanner";
import OvisBadge from "@/app/components/OvisBadge";
import DocGeneratorModal from "@/app/components/docs/DocGeneratorModal";
import { featureFlags } from "@/lib/featureFlags";

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
    ai_pending: "Job pack is being generated…",
    ai_complete: "Job pack ready.",
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
    pending_confirmation: "bg-purple-100 text-purple-700",
    booked: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  const labels: Record<JobWorkflowStatus, string> = {
    pending: "Pending",
    pending_confirmation: "Awaiting Confirmation",
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

function SummarySection({ content, editButton }: { content?: string; editButton?: React.ReactNode }) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n|\n/).filter(p => p.trim());

  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Summary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        {editButton}
      </div>
      <div className="pl-10 space-y-2">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-700 leading-relaxed">{p}</p>
        ))}
      </div>
    </div>
  );
}

function PricingSection({ 
  content, 
  effectiveRates,
  quoteNumber,
  quoteVersion,
  quoteExpiryAt,
  quoteLastSentAt,
  isConfirmed = false,
}: { 
  content?: string; 
  effectiveRates?: EffectiveRates | null;
  quoteNumber?: string | null;
  quoteVersion?: number | null;
  quoteExpiryAt?: string | null;
  quoteLastSentAt?: string | null;
  isConfirmed?: boolean;
}) {
  if (!content) return null;

  let parsedQuote: ParsedQuote | null = null;
  try {
    parsedQuote = JSON.parse(content);
  } catch {
    // Parse failed, will show fallback
  }

  // Format effective rates for display
  const ratesDisplay = effectiveRates ? formatEffectiveRatesForDisplay(effectiveRates) : null;

  // Calculate realistic estimate range
  const estimateRange = calculateEstimateRange(content);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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
        {/* Quote metadata */}
        {(quoteNumber || quoteVersion || quoteExpiryAt || quoteLastSentAt) && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-sm">
            {quoteNumber && (
              <div>
                <span className="text-slate-500">Quote #:</span>{" "}
                <span className="font-medium text-slate-900">{quoteNumber}</span>
              </div>
            )}
            {quoteVersion != null && (
              <div>
                <span className="text-slate-500">Version:</span>{" "}
                <span className="font-medium text-slate-900">v{quoteVersion}</span>
              </div>
            )}
            {quoteLastSentAt && (
              <div>
                <span className="text-slate-500">Last sent:</span>{" "}
                <span className="font-medium text-slate-900">{formatDate(quoteLastSentAt)}</span>
              </div>
            )}
            {quoteExpiryAt && (
              <div>
                <span className="text-slate-500">Valid until:</span>{" "}
                <span className={`font-medium ${
                  new Date(quoteExpiryAt) < new Date() ? "text-red-600" : "text-slate-900"
                }`}>
                  {formatDate(quoteExpiryAt)}
                  {new Date(quoteExpiryAt) < new Date() && " (Expired)"}
                </span>
              </div>
            )}
          </div>
        )}
        {/* Show "based on your rates" if effective rates are available */}
        {ratesDisplay && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Based on your rates:</span> {ratesDisplay}
            </p>
          </div>
        )}
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
                {/* Display realistic range instead of identical min/max */}
                <p className="text-lg font-bold text-amber-900 mt-2">
                  {estimateRange.formattedRange}
                </p>
              </div>
            )}
          </div>
        ) : (
          <pre className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {content}
          </pre>
        )}
        
        {/* Pricing disclaimer - Only show for unconfirmed packs (R5) */}
        {!isConfirmed && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Important:</strong> All pricing shown is an estimate only. Labour hours and material costs are approximate and must be confirmed against actual site conditions and current supplier pricing before sending to clients.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeSection({ content, editButton }: { content?: string; editButton?: React.ReactNode }) {
  if (!content) return null;

  const lines = content.split("\n").filter(line => line.trim());

  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Scope of Work"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        {editButton}
      </div>
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
  variant = "check",
  editButton,
}: { 
  title: string; 
  content?: string; 
  icon: React.ReactNode;
  variant?: "check" | "x";
  editButton?: React.ReactNode;
}) {
  if (!content) return null;

  const items = content.split("\n").filter(item => item.trim());
  if (items.length === 0) return null;

  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="flex items-center justify-between">
        <SectionHeader title={title} icon={icon} />
        {editButton}
      </div>
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
  isConfirmed = false,
}: { 
  content?: string;
  overrideText?: string | null;
  showRoughEstimateDisclaimer?: boolean;
  editButton?: React.ReactNode;
  isConfirmed?: boolean;
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
          // R3: Show user-friendly message instead of raw JSON when parsing fails
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 italic">
              Materials data available but could not be formatted. Please use the Materials Management section to add structured materials.
            </p>
          </div>
        ) : null}

        {/* Materials disclaimer - Only show for unconfirmed packs (R5) */}
        {showDisclaimer && !isConfirmed && (
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

function NotesSection({ content, editButton }: { content?: string; editButton?: React.ReactNode }) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n|\n/).filter(p => p.trim());

  return (
    <div className="pb-0">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Client Notes"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
        {editButton}
      </div>
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
  
  const user = await requireActiveUser(`/jobs/${id}`);

  const job = await getJobById(id);
  
  if (!job) {
    notFound();
  }

  // Security check - ensure user owns this job OR is admin (admins can view all jobs)
  const userIsAdmin = isAdmin(user);
  
  if (job.userId !== user.id && !userIsAdmin) {
    redirect("/jobs");
  }

  // Handle deleted jobs - redirect to jobs list
  if (job.isDeleted === true) {
    redirect("/jobs?error=job_removed");
  }

  // Get verification status (with default for older users)
  const verificationStatus = user.verificationStatus || "unverified";
  const userRole: UserRole = (user.role || "tradie") as UserRole;
  const isVerified = verificationStatus === "verified";
  
  // Get plan info and business profile from Prisma
  let planTier = "FREE";
  let planStatus = "TRIAL";
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
    const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { 
        planTier: true, 
        planStatus: true,
        // Business profile fields for PDF headers
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
    if (prismaUser?.planTier) {
      planTier = prismaUser.planTier;
    }
    if (prismaUser?.planStatus) {
      planStatus = prismaUser.planStatus;
    }
    // Build business profile for PDF exports
    if (prismaUser?.businessName) {
      businessProfile = {
        legalName: prismaUser.businessName || undefined,
        tradingName: prismaUser.tradingName || undefined,
        abn: prismaUser.abn || undefined,
        email: prismaUser.email || undefined,
        phone: prismaUser.businessPhone || undefined,
        addressLine1: prismaUser.businessAddressLine1 || undefined,
        addressLine2: prismaUser.businessAddressLine2 || undefined,
        suburb: prismaUser.businessSuburb || undefined,
        state: prismaUser.businessState || undefined,
        postcode: prismaUser.businessPostcode || undefined,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch plan tier:", error);
  }
  
  // Check if user has paid plan (admin users always have access)
  const userHasPaidPlan = userIsAdmin || planTier !== "FREE";
  const userIsFreePlan = !userIsAdmin && planTier === "FREE";
  
  // Check if this is a client job (posted via client portal)
  const isClientJob = job.leadSource === "CLIENT_PORTAL";

  // For client view, get tradie verification status
  let tradieVerificationStatus: string | null = null;
  if (userRole === "client") {
    // Fetch the tradie's verification status from Prisma
    try {
      const { getUserVerification } = await import("@/lib/verification");
      const tradieVerification = await getUserVerification(job.userId);
      tradieVerificationStatus = tradieVerification?.status || null;
    } catch (err) {
      // Silently fail - don't break the page
      console.warn("Failed to fetch tradie verification status:", err);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Structuring Banner for unstructured tradies */}
      {userRole === "tradie" && verificationStatus !== "verified" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-amber-800">
                {(verificationStatus === "pending" || (verificationStatus as string) === "pending_review") 
                  ? "Verification in progress" 
                  : "Complete your business verification"}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {(verificationStatus === "pending" || (verificationStatus as string) === "pending_review")
                  ? "Your verification is being reviewed. You'll be able to email job packs once approved."
                  : "Complete your business profile to display your \"Verified Trade\" badge and email job packs directly to clients."}
              </p>
              {verificationStatus !== "pending" && (verificationStatus as string) !== "pending_review" && (
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

              {/* Action Required Banner - when client has responded but job status not updated */}
              {job.clientStatus === "accepted" && job.jobStatus === "pending" && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-emerald-900 mb-1">
                        Client Accepted! 🎉
                      </p>
                      <p className="text-sm text-emerald-700">
                        Use &quot;Change status&quot; above to mark the job as Booked when ready to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {job.clientStatus === "declined" && job.jobStatus === "pending" && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-rose-900 mb-1">
                        Client Declined
                      </p>
                      <p className="text-sm text-rose-700">
                        Use &quot;Change status&quot; above to mark as Cancelled, or follow up with the client.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                {job.clientStatus === "accepted" && job.clientAcceptedAt && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="font-semibold text-emerald-900 mb-2">Client Acceptance</p>
                    <div className="space-y-1 text-sm text-emerald-700">
                      <p><span className="font-medium">Status:</span> Accepted</p>
                      <p><span className="font-medium">When:</span> {formatDate(job.clientAcceptedAt)}</p>
                      {job.clientAcceptedByName && (
                        <p><span className="font-medium">Accepted by:</span> {job.clientAcceptedByName}</p>
                      )}
                      {job.quoteNumber && job.clientAcceptedQuoteVer && (
                        <p><span className="font-medium">Quote:</span> {job.quoteNumber} v{job.clientAcceptedQuoteVer}</p>
                      )}
                      {job.clientAcceptanceNote && (
                        <div className="mt-2 pt-2 border-t border-emerald-200">
                          <p className="font-medium">Client note:</p>
                          <p className="text-emerald-600 whitespace-pre-wrap">{job.clientAcceptanceNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {job.clientStatus === "declined" && job.clientDeclinedAt && (
                  <div className="mt-2 text-xs text-slate-600">
                    <p className="font-medium">Declined</p>
                    <p>on {formatDate(job.clientDeclinedAt)}</p>
                  </div>
                )}
                {job.clientStatus === "sent" && (
                  <div className="mt-2 text-xs text-slate-500">
                    <p>Awaiting client decision</p>
                  </div>
                )}
                {(!job.clientStatus || job.clientStatus === "draft") && (
                  <div className="mt-2 text-xs text-slate-500">
                    <p>Not sent to client yet</p>
                  </div>
                )}
                {job.clientStatusUpdatedAt && job.clientStatus !== "accepted" && job.clientStatus !== "declined" && (
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

              {/* Structured Account Badge (for tradie view) */}
              {isVerified && userRole !== "client" && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-300">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Verified account</span>
                  </div>
                </div>
              )}

              {/* Client Details */}
              {(job.clientName || job.clientEmail) && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500 font-medium">Client</p>
                    {job.clientId && userRole !== "client" && (
                      <Link
                        href={`/clients/${job.clientId}`}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                      >
                        View profile →
                      </Link>
                    )}
                  </div>
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

              {/* Schedule Section - Only for tradie/business users */}
              {userRole !== "client" && (
                <div className="pt-4 border-t border-slate-200">
                  <ScheduleSection
                    jobId={job.id}
                    scheduledStartAt={job.scheduledStartAt}
                    scheduledEndAt={job.scheduledEndAt}
                    scheduleNotes={job.scheduleNotes}
                  />
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
                  ) : (verificationStatus === "pending" || (verificationStatus as string) === "pending_review") ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending
                    </span>
                  ) : (verificationStatus as string) === "rejected" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full border border-slate-200">
                      Pending
                    </span>
                  )}
                </div>
              )}

              {/* Job Actions */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                {/* Save as Template Button - Only for non-client users */}
                {userRole !== "client" && (
                  <SaveAsTemplateButton job={job} />
                )}
                {/* Duplicate Job Button - Only for non-client users */}
                {userRole !== "client" && (
                  <DuplicateJobButton jobId={job.id} />
                )}
                <DeleteJobButton jobId={job.id} />
                <div>
                  <FeedbackButton jobId={job.id} variant="compact" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - AI Job Pack or Client View */}
        <div className="lg:col-span-2">
          {/* Client View - Simplified job posting view */}
          {userRole === "client" ? (
            <div className="space-y-6">
              {/* Job Details Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Your Job Posting</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Job Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Title</p>
                        <p className="text-slate-900 font-medium">{job.title}</p>
                      </div>
                      {job.address && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Location</p>
                          <p className="text-slate-900 font-medium">{job.address}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Trade Type</p>
                        <p className="text-slate-900 font-medium">{job.tradeType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Property Type</p>
                        <p className="text-slate-900 font-medium">{job.propertyType}</p>
                      </div>
                      {job.notes && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Description</p>
                          <p className="text-slate-700 whitespace-pre-wrap">{job.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Date/Time - Read-only for clients */}
                  {(job.scheduledStartAt || job.scheduledEndAt) && (
                    <div className="pt-6 border-t border-slate-200">
                      <h3 className="text-lg font-medium text-slate-900 mb-4">Scheduled Date & Time</h3>
                      <div className="space-y-3">
                        {job.scheduledStartAt && (
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Start</p>
                            <p className="text-slate-900 font-medium">{formatDateTimeForDisplay(job.scheduledStartAt)}</p>
                          </div>
                        )}
                        {job.scheduledEndAt && (
                          <div>
                            <p className="text-sm text-slate-500 mb-1">End</p>
                            <p className="text-slate-900 font-medium">{formatDateTimeForDisplay(job.scheduledEndAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Status</h3>
                    <div className="flex items-center gap-2">
                      <JobWorkflowStatusBadge status={job.jobStatus || "pending"} />
                      {job.jobStatus === "pending" && (
                        <p className="text-sm text-slate-600">Your job posting is awaiting tradie responses.</p>
                      )}
                      {job.jobStatus === "booked" && (
                        <p className="text-sm text-slate-600">A tradie has been assigned to this job.</p>
                      )}
                      {job.jobStatus === "completed" && (
                        <p className="text-sm text-slate-600">This job has been completed.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Review & Signing (only show if AI pack exists) */}
              {(job.status === "ai_complete" || job.status === "pending_regeneration") && (
                <ClientQuoteReview
                  jobId={job.id}
                  jobTitle={job.title}
                  address={job.address}
                  aiSummary={job.aiSummary}
                  aiQuote={job.aiQuote}
                  aiScopeOfWork={job.aiScopeOfWork}
                  aiInclusions={job.aiInclusions}
                  aiExclusions={job.aiExclusions}
                  aiClientNotes={job.aiClientNotes}
                  clientStatus={job.clientStatus}
                  clientAcceptedAt={job.clientAcceptedAt}
                  clientDeclinedAt={job.clientDeclinedAt}
                  clientSignedName={job.clientSignedName}
                  clientSignedEmail={job.clientSignedEmail}
                  userEmail={user.email}
                  tradieVerificationStatus={tradieVerificationStatus}
                />
              )}
            </div>
          ) : (
            <>
              {/* Trade/Business View - Full AI Job Pack */}
              {/* SWMS UI START – job detail page */}
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
            <>
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
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">Job Pack</h2>
                      <OvisBadge variant="inline" size="sm" />
                    </div>
                  </div>
                  
                  {/* Consolidated Action Buttons */}
                  <div className="space-y-4">
                    {/* Primary Actions Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <DuplicateJobButton jobId={job.id} />
                      {job.aiReviewStatus !== "confirmed" && job.clientStatus !== "accepted" && (
                        <RegenerateButton 
                          jobId={job.id} 
                          status={job.status} 
                          aiReviewStatus={job.aiReviewStatus}
                          clientStatus={job.clientStatus}
                        />
                      )}
                      <CopyForClientButton
                        title={job.title}
                        address={job.address}
                        summary={job.aiSummary}
                        scopeOfWork={job.aiScopeOfWork}
                        inclusions={job.aiInclusions}
                        exclusions={job.aiExclusions}
                        quoteJson={job.aiQuote}
                      />
                    </div>

                    {/* Client Communication Row */}
                    <div className="flex flex-wrap items-center gap-2">
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
                        planTier={planTier}
                      />
                      <SendToClientButton
                        jobId={job.id}
                        jobTitle={job.title}
                        clientEmail={job.clientEmail}
                        clientName={job.clientName}
                        sentToClientAt={job.sentToClientAt}
                        verificationStatus={user.verificationStatus || "unverified"}
                        planTier={planTier}
                      />
                      {(!job.clientStatus || job.clientStatus === "draft") && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Once emailed, job moves to &ldquo;Sent&rdquo; status
                        </span>
                      )}
                    </div>

                    {/* Export & Documents Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* R9, R10: PDF generation now uses server endpoint for proper export gating */}
                      <JobPackPdfButton
                        jobId={job.id}
                        aiReviewStatus={job.aiReviewStatus}
                      />
                      <SpecDocButton 
                        jobId={job.id}
                        hasScopeOfWork={!!job.aiScopeOfWork}
                        user={user}
                        planTier={planTier}
                        planStatus={planStatus}
                      />
                    </div>

                    {/* Status Messages */}
                    {(job.aiReviewStatus === "confirmed" || job.clientStatus === "accepted") && (
                      <div className="text-xs text-slate-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <p className="font-medium mb-1">
                          {job.clientStatus === "accepted" 
                            ? "✓ Quote signed by client" 
                            : "✓ Job pack confirmed"}
                        </p>
                        <p className="text-slate-600">
                          {job.clientStatus === "accepted"
                            ? "This pack has been signed. Create a variation for changes."
                            : "Manual adjustments allowed. For major changes, duplicate this job."}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Client Signature Status */}
                  <div className="mt-3">
                    <ClientSignatureStatus
                      jobId={job.id}
                      docType="QUOTE"
                      docKey={null}
                      label="quote"
                    />
                  </div>
                </div>
                {/* Free Plan Warning Banner - Show for free users */}
                {userIsFreePlan && (userRole as string) !== "client" && (
                  <div className="px-6 pt-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900 mb-1">
                            Free Plan Limitations
                          </p>
                          <p className="text-sm text-amber-800">
                            You can generate job packs for free, but a paid membership is required to save client details and send job packs to clients. Upgrade your plan to unlock these features.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Client Details Entry - Show if AI complete but no client details */}
                {(!job.clientName || !job.clientEmail) && (
                  <div className="px-6 pt-6">
                    <ClientDetailsEntry
                      jobId={job.id}
                      currentClientName={job.clientName}
                      currentClientEmail={job.clientEmail}
                      planTier={planTier}
                    />
                  </div>
                )}
                {/* AI Warning Banner - Only show for unconfirmed packs (R2) */}
                {job.aiReviewStatus !== "confirmed" && (
                  <div className="px-6 pt-6">
                    <AIWarningBanner />
                  </div>
                )}
                <div className="p-6 space-y-6">
                  <SummarySection 
                    content={job.aiSummary}
                    editButton={
                      <SectionEditButton
                        jobId={job.id}
                        sectionName="summary"
                        fieldName="aiSummary"
                        currentValue={job.aiSummary}
                        label="Summary"
                        placeholder="Enter a brief summary of the job..."
                      />
                    }
                  />
                  <PricingSection 
                    content={job.aiQuote} 
                    effectiveRates={job.effectiveRates}
                    quoteNumber={job.quoteNumber}
                    quoteVersion={job.quoteVersion}
                    quoteExpiryAt={job.quoteExpiryAt}
                    quoteLastSentAt={job.quoteLastSentAt}
                    isConfirmed={job.aiReviewStatus === "confirmed"}
                  />
                  <ScopeSection 
                    content={job.aiScopeOfWork}
                    editButton={
                      <SectionEditButton
                        jobId={job.id}
                        sectionName="scope"
                        fieldName="aiScopeOfWork"
                        currentValue={job.aiScopeOfWork}
                        label="Scope of Work"
                        placeholder="Enter the scope of work, one item per line..."
                      />
                    }
                  />
                  <ListSection
                    title="Inclusions"
                    content={job.aiInclusions}
                    variant="check"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                    editButton={
                      <SectionEditButton
                        jobId={job.id}
                        sectionName="inclusions"
                        fieldName="aiInclusions"
                        currentValue={job.aiInclusions}
                        label="Inclusions"
                        placeholder="Enter what's included, one item per line..."
                      />
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
                    editButton={
                      <SectionEditButton
                        jobId={job.id}
                        sectionName="exclusions"
                        fieldName="aiExclusions"
                        currentValue={job.aiExclusions}
                        label="Exclusions"
                        placeholder="Enter what's not included, one item per line..."
                      />
                    }
                  />
                  <MaterialsSection 
                    content={job.aiMaterials} 
                    overrideText={job.materialsOverrideText}
                    showRoughEstimateDisclaimer={job.materialsAreRoughEstimate}
                    isConfirmed={job.aiReviewStatus === "confirmed"}
                    editButton={
                      <MaterialsEditButton 
                        jobId={job.id} 
                        currentOverrideText={job.materialsOverrideText}
                        aiMaterials={job.aiMaterials}
                      />
                    }
                  />
                  <NotesSection 
                    content={job.aiClientNotes}
                    editButton={
                      <SectionEditButton
                        jobId={job.id}
                        sectionName="client-notes"
                        fieldName="aiClientNotes"
                        currentValue={job.aiClientNotes}
                        label="Client Notes"
                        placeholder="Enter notes for the client (payment terms, timeline, access requirements, etc.)..."
                      />
                    }
                  />
                </div>
              </div>

              {/* Attachments Section - Only for tradie/business users */}
              <div className="mt-6">
                <AttachmentsSection jobId={job.id} />
              </div>

              {/* Client Signature Display (for trade view) */}
              {job.clientStatus === "accepted" && (
                <div className="mt-6">
                  <ClientSignatureDisplay
                    jobId={job.id}
                    clientSignatureId={job.clientSignatureId}
                    clientSignedName={job.clientSignedName}
                    clientSignedEmail={job.clientSignedEmail}
                    clientAcceptedAt={job.clientAcceptedAt}
                  />
                </div>
              )}
              
              {/* Job Documents Section - Replaces SWMS section */}
              <div className="mt-6">
                <JobDocumentsSection
                  jobId={job.id}
                  jobTitle={job.title}
                  tradeType={job.tradeType}
                  address={job.address}
                  clientName={job.clientName}
                  clientEmail={job.clientEmail}
                  showWarning={
                    job.aiReviewStatus === "confirmed" &&
                    (job.clientStatus === "sent" || job.clientStatus === "accepted")
                  }
                  job={job}
                  user={user}
                  planTier={planTier}
                  planStatus={planStatus}
                />
              </div>

              {/* Safety Section - Tradie/Business only */}
              {(userRole as string) !== "client" && (
                <div className="mt-6">
                  <SafetySection
                    jobId={job.id}
                    jobTitle={job.title}
                    tradeType={job.tradeType}
                    address={job.address}
                    businessName={user.businessDetails?.businessName || user.businessDetails?.tradingName}
                    businessProfile={businessProfile}
                  />
                </div>
              )}

              {/* Suggested Tradies Panel - Client accounts only, locked until further notice */}
              {(userRole as string) === "client" && featureFlags.showSuggestedTradies && (
                <div className="mt-6">
                  <SuggestedTradiesPanel jobId={job.id} />
                </div>
              )}
            </>
          )}

          {job.status === "draft" && (userRole as string) !== "client" && (
            <div className="space-y-6">
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
              
              {/* Job Documents Section - Also visible for draft jobs */}
              <JobDocumentsSection
                jobId={job.id}
                jobTitle={job.title}
                tradeType={job.tradeType}
                address={job.address}
                clientName={job.clientName}
                clientEmail={job.clientEmail}
                showWarning={false}
                user={user}
                planTier={planTier}
                planStatus={planTier === "FREE" ? "TRIAL" : "ACTIVE"}
              />

              {/* Safety Section - Tradie/Business only */}
              <div className="mt-6">
                <SafetySection
                  jobId={job.id}
                  jobTitle={job.title}
                  tradeType={job.tradeType}
                  address={job.address}
                  businessName={user.businessDetails?.businessName || user.businessDetails?.tradingName}
                  businessProfile={businessProfile}
                />
              </div>
            </div>
          )}

          {/* Admin Assignment Panel - Show for client jobs that need assignment */}
          {userIsAdmin && isClientJob && job.assignmentStatus !== "ASSIGNED" && (
            <div className="mt-6">
              <JobAssignmentPanel
                jobId={job.id}
                currentUserId={user.id}
                assignmentStatus={job.assignmentStatus}
              />
            </div>
          )}

          {/* Client Job Assignment Banner - Show for tradies viewing assigned client jobs */}
          {!userIsAdmin && (userRole as string) !== "client" && job.leadSource === "CLIENT_PORTAL" && job.assignedAt && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Client Job:</strong> This job was posted by a client and assigned to you on{" "}
                {formatDateTimeForDisplay(job.assignedAt)}.
              </p>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
