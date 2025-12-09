"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, X } from "lucide-react";

interface QuoteVersion {
  id: string;
  version: number;
  sentAt: string;
  quoteExpiryAt: string | null;
  totalInclGst: number | null;
  summary?: string | null;
  scopeOfWork?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  materialsText?: string | null;
  clientNotes?: string | null;
}

interface QuoteHistoryPanelProps {
  jobId: string;
  versions: QuoteVersion[];
}

export default function QuoteHistoryPanel({ jobId, versions }: QuoteHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);

  if (versions.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "—";
    return `$${Math.round(amount).toLocaleString("en-AU")}`;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-semibold text-slate-900">Quote History</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900">
                      v{version.version}
                    </span>
                    <span className="text-xs text-slate-500">
                      Sent {formatDate(version.sentAt)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    {version.quoteExpiryAt && (
                      <div>
                        <span className="text-slate-500">Expires:</span>{" "}
                        <span className={isExpired(version.quoteExpiryAt) ? "text-red-600 font-medium" : ""}>
                          {formatDate(version.quoteExpiryAt)}
                          {isExpired(version.quoteExpiryAt) && " (Expired)"}
                        </span>
                      </div>
                    )}
                    {version.totalInclGst != null && (
                      <div>
                        <span className="text-slate-500">Total:</span>{" "}
                        <span className="font-medium text-slate-900">
                          {formatCurrency(version.totalInclGst)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingVersion(viewingVersion === version.version ? null : version.version)}
                  className="ml-4 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {viewingVersion === version.version ? "Hide" : "View"} Snapshot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Version Snapshot Modal */}
      {viewingVersion && (() => {
        const versionData = versions.find(v => v.version === viewingVersion);
        if (!versionData) return null;
        
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-slate-900/50 transition-opacity"
                onClick={() => setViewingVersion(null)}
              />
              <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Quote v{versionData.version} Snapshot
                  </h3>
                  <button
                    onClick={() => setViewingVersion(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Sent:</span>{" "}
                      <span className="font-medium">{formatDate(versionData.sentAt)}</span>
                    </div>
                    {versionData.quoteExpiryAt && (
                      <div>
                        <span className="text-slate-500">Expires:</span>{" "}
                        <span className={`font-medium ${
                          isExpired(versionData.quoteExpiryAt) ? "text-red-600" : ""
                        }`}>
                          {formatDate(versionData.quoteExpiryAt)}
                          {isExpired(versionData.quoteExpiryAt) && " (Expired)"}
                        </span>
                      </div>
                    )}
                    {versionData.totalInclGst != null && (
                      <div>
                        <span className="text-slate-500">Total:</span>{" "}
                        <span className="font-medium text-slate-900">
                          {formatCurrency(versionData.totalInclGst)}
                        </span>
                      </div>
                    )}
                  </div>

                  {versionData.summary && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Summary</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{versionData.summary}</p>
                    </div>
                  )}

                  {versionData.scopeOfWork && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Scope of Work</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{versionData.scopeOfWork}</p>
                    </div>
                  )}

                  {versionData.inclusions && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Inclusions</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{versionData.inclusions}</p>
                    </div>
                  )}

                  {versionData.exclusions && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Exclusions</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{versionData.exclusions}</p>
                    </div>
                  )}

                  {versionData.materialsText && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Materials</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{versionData.materialsText}</p>
                    </div>
                  )}

                  {versionData.clientNotes && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Client Notes</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{versionData.clientNotes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setViewingVersion(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

