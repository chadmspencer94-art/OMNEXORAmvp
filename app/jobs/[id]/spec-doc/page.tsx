import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import PrintButton from "./PrintButton";
import AIWarningBanner from "@/app/components/AIWarningBanner";

interface SpecDocPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpecDocPage({ params }: SpecDocPageProps) {
  const { id } = await params;
  
  const user = await requireActiveUser(`/jobs/${id}/spec-doc`);
  const job = await getJobById(id);
  
  if (!job) {
    notFound();
  }

  // Security check - ensure user owns this job
  if (job.userId !== user.id) {
    redirect("/jobs");
  }

  // Check if scope of work exists
  if (!job.aiScopeOfWork || job.aiScopeOfWork.trim() === "") {
    redirect(`/jobs/${id}?error=no_scope`);
  }

  const scopeLines = job.aiScopeOfWork.split("\n").filter(line => line.trim());
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Job
        </Link>
      </div>

      {/* Spec Doc Content - Printable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-0">
        <div className="p-8 print:p-6">
          {/* AI Warning Banner */}
          <div className="mb-6 print:mb-4 print:hidden">
            <AIWarningBanner variant="compact" />
          </div>

          {/* Header */}
          <div className="mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 print:text-2xl">
              Detailed Scope of Work & Specifications
            </h1>
            <div className="h-1 w-20 bg-amber-500 mb-4"></div>
          </div>

          {/* Job Details */}
          <div className="mb-8 print:mb-6 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Project
              </h2>
              <p className="text-lg font-semibold text-slate-900">{job.title}</p>
            </div>
            
            {job.address && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Property Address
                </h2>
                <p className="text-slate-700">{job.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Trade Type
                </h2>
                <p className="text-slate-700">{job.tradeType}</p>
              </div>
              {job.propertyType && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Property Type
                  </h2>
                  <p className="text-slate-700">{job.propertyType}</p>
                </div>
              )}
            </div>

            {job.clientName && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Client
                </h2>
                <p className="text-slate-700">{job.clientName}</p>
                {job.clientEmail && (
                  <p className="text-sm text-slate-600">{job.clientEmail}</p>
                )}
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Document Date
              </h2>
              <p className="text-slate-700">{formatDate(job.updatedAt || job.createdAt)}</p>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="mb-8 print:mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 print:mb-3 border-b border-slate-200 pb-2">
              Scope of Work
            </h2>
            <div className="space-y-3">
              {scopeLines.map((line, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-amber-600 font-semibold flex-shrink-0 w-6">
                    {index + 1}.
                  </span>
                  <p className="text-slate-700 leading-relaxed flex-1">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Specifications Section */}
          {(job.aiInclusions || job.aiMaterials || job.notes) && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 print:mb-3 border-b border-slate-200 pb-2">
                Specifications
              </h2>
              <div className="space-y-4">
                {job.aiInclusions && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Included Items
                    </h3>
                    <ul className="space-y-1.5">
                      {job.aiInclusions.split("\n").filter(line => line.trim()).map((item, index) => (
                        <li key={index} className="flex gap-2 text-slate-700">
                          <span className="text-green-600 font-semibold flex-shrink-0">✓</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.aiMaterials && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Materials
                    </h3>
                    <div className="text-slate-700 whitespace-pre-wrap text-sm">
                      {job.materialsOverrideText || job.aiMaterials}
                    </div>
                  </div>
                )}

                {job.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Additional Notes
                    </h3>
                    <p className="text-slate-700 whitespace-pre-wrap text-sm">{job.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exclusions */}
          {job.aiExclusions && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 print:mb-3 border-b border-slate-200 pb-2">
                Exclusions
              </h2>
              <ul className="space-y-1.5">
                {job.aiExclusions.split("\n").filter(line => line.trim()).map((item, index) => (
                  <li key={index} className="flex gap-2 text-slate-700">
                    <span className="text-red-600 font-semibold flex-shrink-0">✗</span>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Signature Section */}
          <div className="mt-12 print:mt-8 pt-8 print:pt-6 border-t-2 border-slate-300">
            <div className="grid grid-cols-2 gap-8 print:gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-6 print:mb-4">
                  Client Signature
                </h3>
                <div className="border-b-2 border-slate-400 h-16 print:h-12 mb-2"></div>
                <p className="text-xs text-slate-500">
                  {job.clientName || "Client Name"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Date: ________________
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-6 print:mb-4">
                  Contractor Signature
                </h3>
                <div className="border-b-2 border-slate-400 h-16 print:h-12 mb-2"></div>
                <p className="text-xs text-slate-500">
                  {user.email.split("@")[0]}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Date: ________________
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Hidden when printing */}
      <PrintButton jobId={job.id} />

    </div>
  );
}

