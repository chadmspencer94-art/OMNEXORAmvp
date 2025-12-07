"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MatchingJob {
  id: string;
  title: string;
  status: string;
  tradeType: string;
  propertyType: string;
  address?: string;
  createdAt: string;
  matchReasons: string[];
}

export default function MatchingJobsSection() {
  const [jobs, setJobs] = useState<MatchingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatchingJobs() {
      try {
        setLoading(true);
        const response = await fetch("/api/matching/jobs-for-me");
        
        if (!response.ok) {
          throw new Error("Failed to fetch matching jobs");
        }
        
        const data = await response.json();
        
        if (data.message) {
          setMessage(data.message);
          setJobs([]);
        } else {
          setJobs(data.jobs || []);
          setMessage(null);
        }
      } catch (err) {
        setError("Failed to load matching jobs");
        console.error("Error fetching matching jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatchingJobs();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Jobs in your service area</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <p className="mt-4 text-slate-500 text-sm">Loading matching jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Jobs in your service area</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Jobs in your service area</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-600 mb-4">{message}</p>
            <Link
              href="/settings/business-profile"
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
            >
              Complete Business Profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Jobs in your service area</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No matching jobs found</h3>
            <p className="text-slate-500 text-sm">No matching jobs found in your service area yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Jobs in your service area</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-slate-900 font-medium hover:text-amber-600 block mb-1"
                  >
                    {job.title}
                  </Link>
                  <p className="text-slate-600 text-sm mb-2">
                    {job.tradeType} • {job.propertyType}
                    {job.address && (
                      <span className="ml-2 text-slate-500">• {job.address}</span>
                    )}
                  </p>
                  {job.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.matchReasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                        >
                          {reason}
                        </span>
                      ))}
                      {job.matchReasons.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          +{job.matchReasons.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="text-slate-500 text-xs">
                    {new Date(job.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

