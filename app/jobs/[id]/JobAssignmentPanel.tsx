"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Building2, Wrench, MapPin, CheckCircle, UserPlus, AlertCircle } from "lucide-react";
import type { MatchedTradie } from "@/lib/matching";

interface JobAssignmentPanelProps {
  jobId: string;
  currentUserId?: string | null;
  assignmentStatus?: string | null;
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

interface TradieOption {
  id: string;
  email: string;
  businessName: string | null;
  primaryTrade: string | null;
}

export default function JobAssignmentPanel({ 
  jobId, 
  currentUserId,
  assignmentStatus 
}: JobAssignmentPanelProps) {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchedTradie[]>([]);
  const [allTradies, setAllTradies] = useState<TradieOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [selectedTradieId, setSelectedTradieId] = useState("");
  const [isAssigningManual, setIsAssigningManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch suggested matches
        const matchesResponse = await fetch(`/api/jobs/${jobId}/matches`);
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData.matches || []);
        }

        // Fetch all tradies for manual selection
        const tradiesResponse = await fetch("/api/admin/tradies");
        if (tradiesResponse.ok) {
          const tradiesData = await tradiesResponse.json();
          setAllTradies(tradiesData.tradies || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [jobId]);

  const handleAssign = async (tradieUserId: string) => {
    setIsAssigning(tradieUserId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradieUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign job");
      }

      setSuccess(`Job assigned to ${data.job?.userId ? "tradie" : "selected tradie"}`);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to assign job");
    } finally {
      setIsAssigning(null);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedTradieId) {
      setError("Please select a tradie");
      return;
    }

    setIsAssigningManual(true);
    setError(null);
    setSuccess(null);

    try {
      await handleAssign(selectedTradieId);
    } finally {
      setIsAssigningManual(false);
    }
  };

  // Don't show if already assigned
  if (assignmentStatus === "ASSIGNED") {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Job Assignment</h2>
        <p className="text-xs text-slate-500 mt-1">
          Assign this client job to a tradie/business account
        </p>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Suggested Tradies Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Suggested Tradies</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
              <span className="text-slate-600">Finding suitable tradies...</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">
                No strong matches found based on trade and area. You can still manually assign this job below.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                          <h4 className="font-semibold text-slate-900 truncate">
                            {tradie.businessName || tradie.email || "Unknown"}
                          </h4>
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
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {tradie.email && (
                        <a
                          href={`mailto:${tradie.email}`}
                          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{tradie.email}</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleAssign(tradie.userId)}
                        disabled={isAssigning === tradie.userId || isAssigningManual}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAssigning === tradie.userId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Assign this job
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual Assignment Section */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Manual Assignment</h3>
          <div className="flex gap-3">
            <select
              value={selectedTradieId}
              onChange={(e) => setSelectedTradieId(e.target.value)}
              disabled={isAssigningManual || isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a tradie...</option>
              {allTradies.map((tradie) => (
                <option key={tradie.id} value={tradie.id}>
                  {tradie.businessName || tradie.email} {tradie.primaryTrade ? `(${tradie.primaryTrade})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleManualAssign}
              disabled={!selectedTradieId || isAssigningManual || isLoading}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigningManual ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Assigning...
                </>
              ) : (
                "Assign to selected tradie"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

