"use client";

import Link from "next/link";

interface PrintButtonProps {
  jobId: string;
}

export default function PrintButton({ jobId }: PrintButtonProps) {
  return (
    <div className="mt-6 print:hidden flex gap-3">
      <button
        onClick={() => window.print()}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
      >
        Print / Save as PDF
      </button>
      <Link
        href={`/jobs/${jobId}`}
        className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
      >
        Back to Job
      </Link>
    </div>
  );
}

