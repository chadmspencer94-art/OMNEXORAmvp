"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Award,
  Target,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Briefcase,
  BarChart3,
  Shield,
  Sparkles,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  Lightbulb,
  Zap,
} from "lucide-react";
import type { BusinessScoreBreakdown } from "@/lib/businessScore";
import { RATING_TIERS } from "@/lib/businessScore";
import Link from "next/link";

interface AdvancedAnalyticsClientProps {
  primaryTrade: string | null;
}

export default function AdvancedAnalyticsClient({ primaryTrade }: AdvancedAnalyticsClientProps) {
  const [analytics, setAnalytics] = useState<BusinessScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    setError(null);
    
    try {
      const response = await fetch(
        isRefresh ? "/api/me/advanced-analytics" : "/api/me/advanced-analytics",
        { method: isRefresh ? "POST" : "GET" }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load analytics");
      }
      
      const data = await response.json();
      setAnalytics(isRefresh ? data.analytics : data);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="ml-3 text-slate-600">Calculating your business score...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Analytics</h3>
          <p className="text-slate-500 mb-4">{error || "An unexpected error occurred"}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tierInfo = RATING_TIERS[analytics.ratingTier];
  const stars = analytics.totalScore >= 90 ? 5 : 
                analytics.totalScore >= 75 ? 4 : 
                analytics.totalScore >= 60 ? 3 : 
                analytics.totalScore >= 40 ? 2 : 1;

  return (
    <div className="space-y-6">
      {/* Business Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Display */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Business Score</h2>
              <p className="text-sm text-slate-500 mt-1">Overall performance rating</p>
            </div>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh score"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-8">
            {/* Score Circle */}
            <div className="relative">
              <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${tierInfo.color} p-1`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-slate-900">{analytics.totalScore}</span>
                    <span className="text-slate-400 text-sm">/100</span>
                  </div>
                </div>
              </div>
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${tierInfo.color} text-white text-xs font-bold shadow-lg`}>
                {tierInfo.label}
              </div>
            </div>
            
            {/* Stars Display */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-7 h-7 ${star <= stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                  />
                ))}
                <span className="ml-2 text-lg font-semibold text-slate-700">{stars}.0</span>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Your public rating shown to potential clients
              </p>
              
              {/* Score Progress Bars */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-24">Next tier:</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${tierInfo.color} transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, (analytics.totalScore / (analytics.totalScore < 40 ? 40 : analytics.totalScore < 60 ? 60 : analytics.totalScore < 75 ? 75 : analytics.totalScore < 90 ? 90 : 100)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right">
                    {analytics.totalScore < 40 ? `${40 - analytics.totalScore} to Bronze` :
                     analytics.totalScore < 60 ? `${60 - analytics.totalScore} to Silver` :
                     analytics.totalScore < 75 ? `${75 - analytics.totalScore} to Gold` :
                     analytics.totalScore < 90 ? `${90 - analytics.totalScore} to Platinum` :
                     "Max Tier!"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{analytics.quotePerformance.conversionRate}%</p>
                  <p className="text-xs text-slate-500">Quote Win Rate</p>
                </div>
              </div>
              {analytics.quotePerformance.conversionRate >= 40 ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{analytics.jobPerformance.jobsLast30Days}</p>
                  <p className="text-xs text-slate-500">Jobs This Month</p>
                </div>
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{analytics.jobPerformance.totalJobs}</p>
                  <p className="text-xs text-slate-500">Total Jobs</p>
                </div>
              </div>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Score Breakdown</h2>
            <p className="text-sm text-slate-500 mt-1">See how each factor contributes to your rating</p>
          </div>
          <PieChart className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analytics.components).map(([key, value]) => {
            const labels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
              profileCompleteness: { label: "Profile", icon: <Users className="w-4 h-4" />, color: "bg-blue-500" },
              quoteConversion: { label: "Quote Conversion", icon: <Target className="w-4 h-4" />, color: "bg-emerald-500" },
              jobVolume: { label: "Job Volume", icon: <Briefcase className="w-4 h-4" />, color: "bg-purple-500" },
              responseTime: { label: "Response Time", icon: <Clock className="w-4 h-4" />, color: "bg-amber-500" },
              verification: { label: "Verification", icon: <Shield className="w-4 h-4" />, color: "bg-cyan-500" },
              platformEngagement: { label: "Engagement", icon: <Zap className="w-4 h-4" />, color: "bg-pink-500" },
              complianceReadiness: { label: "Compliance", icon: <CheckCircle className="w-4 h-4" />, color: "bg-slate-500" },
            };
            
            const info = labels[key] || { label: key, icon: <Target className="w-4 h-4" />, color: "bg-slate-500" };
            
            return (
              <div key={key} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 ${info.color} rounded-lg flex items-center justify-center text-white`}>
                    {info.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{info.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-900">{Math.round(value.score)}</span>
                    <span className="text-sm text-slate-400">/100</span>
                  </div>
                  <span className="text-xs text-slate-500">{Math.round(value.weight * 100)}% weight</span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${info.color} transition-all duration-500`}
                    style={{ width: `${value.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Boost Your Score</h2>
              <p className="text-sm text-amber-700">Recommendations to improve your rating</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {analytics.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote & Job Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Quote Performance</h3>
              <p className="text-sm text-slate-500">Your conversion metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-3xl font-bold text-emerald-600">{analytics.quotePerformance.acceptedQuotes}</p>
              <p className="text-sm text-slate-600">Accepted</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-3xl font-bold text-amber-600">{analytics.quotePerformance.pendingQuotes}</p>
              <p className="text-sm text-slate-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-3xl font-bold text-red-600">{analytics.quotePerformance.declinedQuotes}</p>
              <p className="text-sm text-slate-600">Declined</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">{analytics.quotePerformance.totalQuotes}</p>
              <p className="text-sm text-slate-600">Total Quotes</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Win Rate</span>
              <span className="text-lg font-bold text-slate-900">{analytics.quotePerformance.conversionRate}%</span>
            </div>
            <div className="mt-2 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(100, analytics.quotePerformance.conversionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Job Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Job Performance</h3>
              <p className="text-sm text-slate-500">Your activity metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600">{analytics.jobPerformance.totalJobs}</p>
              <p className="text-sm text-slate-600">Total Jobs</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">{analytics.jobPerformance.completedJobs}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600">{analytics.jobPerformance.jobsLast30Days}</p>
              <p className="text-sm text-slate-600">Last 30 Days</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-slate-600">{analytics.jobPerformance.jobsLast90Days}</p>
              <p className="text-sm text-slate-600">Last 90 Days</p>
            </div>
          </div>
          
          {analytics.jobPerformance.variationRate > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Variation Rate</span>
                <span className="text-lg font-bold text-amber-700">{analytics.jobPerformance.variationRate}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Avg variation value: ${analytics.jobPerformance.avgVariationValue.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trade-Specific Performance */}
      {analytics.tradeSpecific && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{analytics.tradeSpecific.trade} Industry Benchmarks</h3>
              <p className="text-sm text-slate-500">How you compare to industry standards</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Quote Conversion</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analytics.tradeSpecific.performanceVsBenchmark.quoteConversion === "above" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : analytics.tradeSpecific.performanceVsBenchmark.quoteConversion === "at"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {analytics.tradeSpecific.performanceVsBenchmark.quoteConversion === "above" ? "Above Average" :
                   analytics.tradeSpecific.performanceVsBenchmark.quoteConversion === "at" ? "At Average" : "Below Average"}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Industry avg: {analytics.tradeSpecific.industryBenchmarks.avgQuoteConversion}%
              </p>
              <p className="text-lg font-bold text-slate-900">
                Your rate: {analytics.quotePerformance.conversionRate}%
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Job Volume</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analytics.tradeSpecific.performanceVsBenchmark.jobVolume === "above" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : analytics.tradeSpecific.performanceVsBenchmark.jobVolume === "at"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {analytics.tradeSpecific.performanceVsBenchmark.jobVolume === "above" ? "Above Average" :
                   analytics.tradeSpecific.performanceVsBenchmark.jobVolume === "at" ? "At Average" : "Below Average"}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Industry avg: {analytics.tradeSpecific.industryBenchmarks.avgJobsPerMonth}/month
              </p>
              <p className="text-lg font-bold text-slate-900">
                Your rate: {Math.round(analytics.jobPerformance.jobsLast90Days / 3)}/month
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Response Time</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analytics.tradeSpecific.performanceVsBenchmark.responseTime === "above" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : analytics.tradeSpecific.performanceVsBenchmark.responseTime === "at"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {analytics.tradeSpecific.performanceVsBenchmark.responseTime === "above" ? "Faster" :
                   analytics.tradeSpecific.performanceVsBenchmark.responseTime === "at" ? "Average" : "Slower"}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Industry avg: {analytics.tradeSpecific.industryBenchmarks.avgResponseTime} days
              </p>
              <p className="text-lg font-bold text-slate-900">
                Your avg: {analytics.quotePerformance.avgResponseDays || "N/A"} days
              </p>
            </div>
          </div>
          
          {/* Compliance Checklist */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              {analytics.tradeSpecific.trade} Compliance Standards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analytics.tradeSpecific.complianceChecklist.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile & Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Completeness */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Profile Completeness</h3>
                <p className="text-sm text-slate-500">{analytics.profileCompleteness.percentage}% complete</p>
              </div>
            </div>
            <Link
              href="/settings"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
            >
              Edit Profile
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {Object.entries(analytics.profileCompleteness)
              .filter(([key]) => key !== "percentage")
              .map(([key, completed]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  {completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Platform Engagement */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Platform Engagement</h3>
              <p className="text-sm text-slate-500">Your activity metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-900">{analytics.engagement.loginFrequency}</p>
              <p className="text-xs text-slate-500">Days Active (30d)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-900">{analytics.engagement.materialsLibrarySize}</p>
              <p className="text-xs text-slate-500">Materials in Library</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-900">{analytics.engagement.templatesCreated}</p>
              <p className="text-xs text-slate-500">Job Templates</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-900">{analytics.engagement.clientsManaged}</p>
              <p className="text-xs text-slate-500">Clients in CRM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Calculated Footer */}
      <div className="text-center text-sm text-slate-400">
        Score last calculated: {new Date(analytics.lastCalculated).toLocaleString()}
      </div>
    </div>
  );
}
