"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { UserJobAnalytics } from "@/lib/analytics";

export default function AnalyticsSection() {
  const [analytics, setAnalytics] = useState<UserJobAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/me/analytics");
        if (!response.ok) {
          throw new Error("Failed to load analytics");
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-32"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return null; // Silently fail - don't break dashboard
  }

  const totalQuotes = analytics.quoteCounts.draft + 
                      analytics.quoteCounts.sent + 
                      analytics.quoteCounts.accepted + 
                      analytics.quoteCounts.declined + 
                      analytics.quoteCounts.cancelled;

  // Calculate trend (comparing last 7 days to previous 7 days)
  // We'll approximate by comparing last 7 days to last 30 days average
  const avgJobsPerWeek = analytics.jobsLast30Days / 4;
  const trend = analytics.jobsLast7Days > avgJobsPerWeek ? "up" : 
                analytics.jobsLast7Days < avgJobsPerWeek ? "down" : "flat";
  const trendPercent = avgJobsPerWeek > 0 
    ? Math.round(Math.abs((analytics.jobsLast7Days - avgJobsPerWeek) / avgJobsPerWeek) * 100)
    : 0;

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Your Numbers</h2>
        <p className="text-sm text-slate-500 mt-1">Quick overview of your jobs and quotes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Jobs</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.totalJobs}</p>
              <p className="text-xs text-slate-400 mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Jobs Last 30 Days */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Last 30 Days</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.jobsLast30Days}</p>
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <p className="text-xs text-green-600">Up {trendPercent}%</p>
                  </>
                )}
                {trend === "down" && (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <p className="text-xs text-red-600">Down {trendPercent}%</p>
                  </>
                )}
                {trend === "flat" && (
                  <>
                    <Minus className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-400">Steady</p>
                  </>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Accepted Quotes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Accepted</p>
              <p className="text-3xl font-bold text-green-600">{analytics.quoteCounts.accepted}</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {Math.round((analytics.quoteCounts.accepted / totalQuotes) * 100)}% of quotes
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Awaiting Decision</p>
              <p className="text-3xl font-bold text-amber-600">{analytics.quoteCounts.sent}</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {Math.round((analytics.quoteCounts.sent / totalQuotes) * 100)}% of quotes
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Status Breakdown */}
      {totalQuotes > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quote Status Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{analytics.quoteCounts.draft}</p>
              <p className="text-xs text-slate-500 mt-1">Draft</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {Math.round((analytics.quoteCounts.draft / totalQuotes) * 100)}%
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{analytics.quoteCounts.sent}</p>
              <p className="text-xs text-slate-500 mt-1">Sent</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {Math.round((analytics.quoteCounts.sent / totalQuotes) * 100)}%
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.quoteCounts.accepted}</p>
              <p className="text-xs text-slate-500 mt-1">Accepted</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {Math.round((analytics.quoteCounts.accepted / totalQuotes) * 100)}%
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{analytics.quoteCounts.declined}</p>
              <p className="text-xs text-slate-500 mt-1">Declined</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {Math.round((analytics.quoteCounts.declined / totalQuotes) * 100)}%
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">{analytics.quoteCounts.cancelled}</p>
              <p className="text-xs text-slate-500 mt-1">Cancelled</p>
              {totalQuotes > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {Math.round((analytics.quoteCounts.cancelled / totalQuotes) * 100)}%
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Variation Cost Analytics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Variation Costs</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            Track cost changes
          </span>
        </div>
        
        {analytics.variationMetrics.variationCount > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Variation Cost */}
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className={`text-2xl font-bold ${analytics.variationMetrics.totalVariationCost >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {analytics.variationMetrics.totalVariationCost >= 0 ? '+' : ''}
                ${Math.abs(analytics.variationMetrics.totalVariationCost).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Impact</p>
            </div>
            
            {/* Number of Variations */}
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {analytics.variationMetrics.variationCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">Variations</p>
            </div>
            
            {/* Jobs with Variations */}
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {analytics.variationMetrics.jobsWithVariations}
              </p>
              <p className="text-xs text-slate-500 mt-1">Jobs Affected</p>
            </div>
            
            {/* Average per Variation */}
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className={`text-2xl font-bold ${analytics.variationMetrics.avgVariationCost >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                {analytics.variationMetrics.avgVariationCost >= 0 ? '+' : ''}
                ${Math.abs(analytics.variationMetrics.avgVariationCost).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">Avg per Variation</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 text-sm font-medium">No variations tracked yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Variation costs will appear here as you create job variations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

