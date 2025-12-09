"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, Building2, Wrench, MapPin, CheckCircle } from "lucide-react";
import type { MatchedTradie } from "@/lib/matching";

interface SuggestedTradiesPanelProps {
  jobId: string;
}

function getMatchLabel(score: number): { label: string; color: string } {
  if (score >= 80) {
    return { label: "Great match", color: "text-emerald-700 bg-emerald-100" };
  } else if (score >= 50) {
    return { label: "Good match", color: "text-blue-700 bg-blue-100" };
  } else {
    return { label: "Possible match", color: "text-amber-700 bg-amber-100" };
  }
}

export default function SuggestedTradiesPanel({ jobId }: SuggestedTradiesPanelProps) {
  const [matches, setMatches] = useState<MatchedTradie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/jobs/${jobId}/matches`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load matches");
        }
        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err: any) {
        setError(err.message || "Failed to load suggested tradies");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, [jobId]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Suggested Tradies</h2>
        <p className="text-xs text-slate-500 mt-1">
          Tradies who match this job based on trade, work type, and service area
        </p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
            <span className="text-slate-600">Finding suitable tradies...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              No strong matches found based on trade and service area.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((tradie) => {
              const matchInfo = getMatchLabel(tradie.matchScore);
              const workTypes = [];
              if (tradie.workTypes.residential) workTypes.push("Residential");
              if (tradie.workTypes.commercial) workTypes.push("Commercial");
              if (tradie.workTypes.strata) workTypes.push("Strata");

              return (
                <div
                  key={tradie.userId}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <h3 className="font-semibold text-slate-900 truncate">
                          {tradie.businessName || tradie.email || "Unknown"}
                        </h3>
                      </div>
                      {tradie.primaryTrade && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <Wrench className="w-3 h-3" />
                          <span>{tradie.primaryTrade}</span>
                        </div>
                      )}
                      {tradie.serviceAreaSummary && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{tradie.serviceAreaSummary}</span>
                        </div>
                      )}
                      {workTypes.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>{workTypes.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${matchInfo.color}`}
                      >
                        {matchInfo.label}
                      </span>
                      <span className="text-xs text-slate-500">Score: {tradie.matchScore}</span>
                    </div>
                  </div>
                  {tradie.email && (
                    <div className="pt-3 border-t border-slate-100">
                      <a
                        href={`mailto:${tradie.email}`}
                        className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{tradie.email}</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

