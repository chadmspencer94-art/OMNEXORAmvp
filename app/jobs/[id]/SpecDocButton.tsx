"use client";

import { useState } from "react";
import Link from "next/link";

interface SpecDocButtonProps {
  jobId: string;
  hasScopeOfWork: boolean;
}

export default function SpecDocButton({ jobId, hasScopeOfWork }: SpecDocButtonProps) {
  if (!hasScopeOfWork) {
    return (
      <button
        disabled
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
        title="Add scope of work to create a spec doc"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Create Spec Doc
      </button>
    );
  }

  return (
    <Link
      href={`/jobs/${jobId}/spec-doc`}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Create Spec Doc from this job
    </Link>
  );
}

