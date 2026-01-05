"use client";

import type { RenderModel } from "@/lib/docEngine/types";

interface DocOvisPanelProps {
  model: RenderModel;
}

export default function DocOvisPanel({ model }: DocOvisPanelProps) {
  if (model.ovisWarnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-900">
            OVIS checks complete. No warnings identified.
          </p>
        </div>
      </div>
    );
  }

  const highSeverity = model.ovisWarnings.filter((w) => w.severity === "high");
  const mediumSeverity = model.ovisWarnings.filter((w) => w.severity === "medium");
  const lowSeverity = model.ovisWarnings.filter((w) => w.severity === "low");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-900">
          OVIS Checks
        </h3>
        <span className="text-xs text-slate-500">
          (Output Variance & Integrity Signals)
        </span>
      </div>

      <div className="text-xs text-slate-600 mb-4 bg-slate-50 border border-slate-200 rounded p-3">
        <p>
          OVIS highlights possible missing info or inconsistencies. Drafts require your review before use. Not certification.
        </p>
      </div>

      {/* High Severity */}
      {highSeverity.length > 0 && (
        <div className="space-y-2">
          {highSeverity.map((warning) => (
            <div
              key={warning.id}
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-red-900 uppercase">High</span>
                </div>
                <p className="text-sm text-red-900">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Medium Severity */}
      {mediumSeverity.length > 0 && (
        <div className="space-y-2">
          {mediumSeverity.map((warning) => (
            <div
              key={warning.id}
              className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3"
            >
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber-900 uppercase">Medium</span>
                </div>
                <p className="text-sm text-amber-900">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Low Severity */}
      {lowSeverity.length > 0 && (
        <div className="space-y-2">
          {lowSeverity.map((warning) => (
            <div
              key={warning.id}
              className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-900 uppercase">Low</span>
                </div>
                <p className="text-sm text-blue-900">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

