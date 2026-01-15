"use client";

import { calculateEstimateRange } from "@/lib/pricing";
import JobPackPdfButton from "@/app/jobs/[id]/JobPackPdfButton";
import type { Job } from "@/lib/jobs";

interface BusinessProfile {
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
}

interface ClientJobPackViewProps {
  job: Job;
  businessProfile?: BusinessProfile | null;
}

export default function ClientJobPackView({ job, businessProfile }: ClientJobPackViewProps) {
  const estimateRange = calculateEstimateRange(job.aiQuote);

  // Helper to format text content (preserve line breaks)
  const formatContent = (content: string | undefined | null) => {
    if (!content) return null;
    // Split by double newlines for paragraphs, single newlines for line breaks
    return content.split(/\n\n+/).map((para, i) => (
      <p key={i} className="mb-3 last:mb-0 whitespace-pre-line text-slate-700 leading-relaxed">
        {para}
      </p>
    ));
  };

  // Helper to format bullet lists
  const formatBulletList = (content: string | undefined | null) => {
    if (!content) return null;
    const lines = content.split("\n").filter((line) => line.trim());
    return (
      <ul className="list-disc list-inside space-y-2 text-slate-700">
        {lines.map((line, i) => (
          <li key={i} className="leading-relaxed">{line.trim().replace(/^[-•*]\s*/, "")}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pricing Summary */}
      {estimateRange.baseTotal !== null && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Estimated Total</h2>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {estimateRange.formattedRange}
          </p>
          <p className="text-sm text-slate-600">
            This is an estimate. Final pricing may vary based on actual work completed.
          </p>
        </div>
      )}

      {/* Summary */}
      {job.aiSummary && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
          <div>{formatContent(job.aiSummary)}</div>
        </div>
      )}

      {/* Scope of Work */}
      {job.aiScopeOfWork && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Scope of Work</h2>
          <div>{formatContent(job.aiScopeOfWork)}</div>
        </div>
      )}

      {/* Inclusions */}
      {job.aiInclusions && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Included</h2>
          <div>{formatBulletList(job.aiInclusions) || formatContent(job.aiInclusions)}</div>
        </div>
      )}

      {/* Exclusions */}
      {job.aiExclusions && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Not Included</h2>
          <div>{formatBulletList(job.aiExclusions) || formatContent(job.aiExclusions)}</div>
        </div>
      )}

      {/* Materials */}
      {(job.aiMaterials || job.materialsOverrideText) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Materials</h2>
          <div>
            {formatBulletList(job.materialsOverrideText || job.aiMaterials) || 
             formatContent(job.materialsOverrideText || job.aiMaterials)}
          </div>
          {job.materialsAreRoughEstimate && (
            <p className="mt-4 text-sm text-amber-600 italic">
              Note: Material costs are rough estimates and may vary.
            </p>
          )}
        </div>
      )}

      {/* Notes for Client */}
      {job.aiClientNotes && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes for You</h2>
          <div>{formatContent(job.aiClientNotes)}</div>
        </div>
      )}

      {/* Download PDF */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Download Job Pack</h2>
        <p className="text-slate-600 mb-4 text-sm">
          Download a complete PDF version of this job pack for your records.
        </p>
        {/* R9, R10: PDF generation now uses server endpoint for proper export gating */}
        <JobPackPdfButton
          jobId={job.id}
          aiReviewStatus={job.aiReviewStatus}
        />
      </div>
    </div>
  );
}

