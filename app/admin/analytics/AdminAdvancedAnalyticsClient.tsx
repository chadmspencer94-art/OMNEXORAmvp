"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Shield,
  Mail,
  MapPin,
  Loader2,
  RefreshCw,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Package,
  LayoutGrid,
  UserCheck,
  Clock,
  Zap,
} from "lucide-react";

interface AdminAnalyticsData {
  users: {
    total: number;
    last7Days: number;
    last30Days: number;
    verifiedEmails: number;
    verifiedBusinesses: number;
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
    emailVerificationRate: number;
    businessVerificationRate: number;
    byRole: { role: string; count: number }[];
    byPlan: { plan: string; count: number }[];
    byTrade: { trade: string; count: number }[];
    byState: { state: string; count: number }[];
    bySignupSource: { source: string; count: number }[];
  };
  jobs: {
    total: number;
    last7Days: number;
    last30Days: number;
    avgPerUser: number;
    byStatus: { status: string; count: number }[];
  };
  quotes: {
    total: number;
    last30Days: number;
    byStatus: { status: string; count: number }[];
    conversionRate: number;
    totalAcceptedValue: number;
  };
  businessScores: {
    average: number;
    distribution: {
      platinum: number;
      gold: number;
      silver: number;
      bronze: number;
      starter: number;
    };
    byTrade: { trade: string; avgScore: number; count: number }[];
    totalWithScore: number;
  };
  documents: {
    safetyDocs: { total: number; last30Days: number };
  };
  engagement: {
    totalMaterials: number;
    totalTemplates: number;
    totalClients: number;
  };
  trends: {
    dailySignups: { date: string; count: number }[];
    dailyJobs: { date: string; count: number }[];
  };
  topPerformers: {
    id: string;
    email: string;
    businessName: string | null;
    primaryTrade: string | null;
    totalJobs: number;
    businessScore: number;
  }[];
  generatedAt: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  gradient,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  gradient: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
            {trendLabel && <span className="text-slate-500 ml-1">{trendLabel}</span>}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function DistributionBar({
  data,
  colors,
}: {
  data: { label: string; value: number; color: string }[];
  colors?: Record<string, string>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden bg-slate-700">
        {data.map((item, i) => (
          <div
            key={i}
            className={`${item.color} transition-all`}
            style={{ width: `${(item.value / total) * 100}%` }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className="text-xs font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <Icon className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminAdvancedAnalyticsClient() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/advanced-analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-slate-400">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
        <p className="text-red-400 mb-4">{error || "Failed to load analytics"}</p>
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const scoreDistData = [
    { label: "Platinum", value: data.businessScores.distribution.platinum, color: "bg-gradient-to-r from-slate-400 to-slate-500" },
    { label: "Gold", value: data.businessScores.distribution.gold, color: "bg-gradient-to-r from-amber-400 to-amber-500" },
    { label: "Silver", value: data.businessScores.distribution.silver, color: "bg-gradient-to-r from-slate-300 to-slate-400" },
    { label: "Bronze", value: data.businessScores.distribution.bronze, color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { label: "Starter", value: data.businessScores.distribution.starter, color: "bg-gradient-to-r from-slate-500 to-slate-600" },
  ];

  const quoteStatusData = data.quotes.byStatus.map(s => ({
    label: s.status,
    value: s.count,
    color: s.status === "ACCEPTED" ? "bg-emerald-500" :
           s.status === "SENT" ? "bg-blue-500" :
           s.status === "DECLINED" ? "bg-rose-500" :
           s.status === "DRAFT" ? "bg-slate-500" : "bg-slate-600",
  }));

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Users"
          value={data.users.total}
          subtitle={`+${data.users.last7Days} this week`}
          icon={Users}
          gradient="from-violet-500 to-purple-600"
        />
        <MetricCard
          title="Total Jobs"
          value={data.jobs.total}
          subtitle={`${data.jobs.avgPerUser} avg/user`}
          icon={Briefcase}
          gradient="from-blue-500 to-indigo-600"
        />
        <MetricCard
          title="Total Quotes"
          value={data.quotes.total}
          subtitle={`${data.quotes.conversionRate}% conversion`}
          icon={FileText}
          gradient="from-emerald-500 to-teal-600"
        />
        <MetricCard
          title="Accepted Value"
          value={`$${(data.quotes.totalAcceptedValue / 1000).toFixed(0)}k`}
          subtitle="Total quote value"
          icon={DollarSign}
          gradient="from-amber-500 to-orange-600"
        />
        <MetricCard
          title="Avg Score"
          value={data.businessScores.average}
          subtitle={`${data.businessScores.totalWithScore} with scores`}
          icon={Award}
          gradient="from-pink-500 to-rose-600"
        />
        <MetricCard
          title="Active Users"
          value={data.users.activeUsersLast7Days}
          subtitle="Last 7 days"
          icon={Activity}
          gradient="from-cyan-500 to-blue-600"
        />
      </div>

      {/* User Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="User Growth & Verification" icon={UserCheck}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{data.users.last30Days}</p>
              <p className="text-xs text-slate-400">New users (30d)</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{data.users.activeUsersLast30Days}</p>
              <p className="text-xs text-slate-400">Active users (30d)</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Verified</span>
                <span className="text-white font-medium">{data.users.verifiedEmails} ({data.users.emailVerificationRate.toFixed(0)}%)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${data.users.emailVerificationRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Business Verified</span>
                <span className="text-white font-medium">{data.users.verifiedBusinesses} ({data.users.businessVerificationRate.toFixed(0)}%)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${data.users.businessVerificationRate}%` }} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Business Score Distribution" icon={Award}>
          <div className="mb-6">
            <DistributionBar data={scoreDistData} />
          </div>
          
          {data.businessScores.byTrade.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-3">Average Score by Trade</p>
              <div className="space-y-2">
                {data.businessScores.byTrade.slice(0, 5).map((item) => (
                  <div key={item.trade} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.trade}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${item.avgScore}%` }} />
                      </div>
                      <span className="text-sm font-medium text-white w-8 text-right">{item.avgScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Trade & Location Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Users by Trade" icon={Briefcase}>
          {data.users.byTrade.length > 0 ? (
            <div className="space-y-2">
              {data.users.byTrade.sort((a, b) => b.count - a.count).slice(0, 8).map((item) => (
                <div key={item.trade} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate-300">{item.trade}</span>
                  <span className="text-sm font-medium text-white bg-white/10 px-2 py-0.5 rounded">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No trade data available</p>
          )}
        </SectionCard>

        <SectionCard title="Users by State" icon={MapPin}>
          {data.users.byState.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.users.byState.sort((a, b) => b.count - a.count).map((item) => (
                <div key={item.state} className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{item.state}</span>
                  <span className="text-sm font-medium text-white">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No location data available</p>
          )}
        </SectionCard>
      </div>

      {/* Quote Performance */}
      <SectionCard title="Quote Performance" icon={Target}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{data.quotes.total}</p>
            <p className="text-xs text-slate-400">Total Quotes</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{data.quotes.conversionRate}%</p>
            <p className="text-xs text-slate-400">Conversion Rate</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{data.quotes.last30Days}</p>
            <p className="text-xs text-slate-400">Last 30 Days</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">${data.quotes.totalAcceptedValue.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Accepted Value</p>
          </div>
        </div>
        <DistributionBar data={quoteStatusData} />
      </SectionCard>

      {/* Engagement & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Platform Engagement" icon={Activity}>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Package className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{data.engagement.totalMaterials}</p>
              <p className="text-xs text-slate-400">Materials</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <LayoutGrid className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{data.engagement.totalTemplates}</p>
              <p className="text-xs text-slate-400">Templates</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{data.engagement.totalClients}</p>
              <p className="text-xs text-slate-400">Clients</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-slate-400 mb-3">Safety Documents</p>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="text-white font-medium">{data.documents.safetyDocs.total} Total</span>
              </div>
              <span className="text-sm text-slate-400">+{data.documents.safetyDocs.last30Days} last 30d</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Top Performers" icon={Star}>
          {data.topPerformers.length > 0 ? (
            <div className="space-y-2">
              {data.topPerformers.slice(0, 5).map((user, i) => (
                <div key={user.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-amber-500 text-white" :
                    i === 1 ? "bg-slate-400 text-white" :
                    i === 2 ? "bg-orange-500 text-white" :
                    "bg-slate-600 text-slate-300"
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.businessName || user.email}</p>
                    <p className="text-xs text-slate-500">{user.primaryTrade || "No trade"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.totalJobs} jobs</p>
                    <p className="text-xs text-slate-500">Score: {user.businessScore}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No performers data available</p>
          )}
        </SectionCard>
      </div>

      {/* Signup Sources & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Signup Sources" icon={Zap}>
          {data.users.bySignupSource.length > 0 ? (
            <div className="space-y-2">
              {data.users.bySignupSource.sort((a, b) => b.count - a.count).map((item) => (
                <div key={item.source} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate-300">{item.source || "Unknown"}</span>
                  <span className="text-sm font-medium text-white bg-white/10 px-2 py-0.5 rounded">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No signup source data</p>
          )}
        </SectionCard>

        <SectionCard title="Plan Distribution" icon={Crown}>
          {data.users.byPlan.length > 0 ? (
            <div className="space-y-2">
              {data.users.byPlan.sort((a, b) => b.count - a.count).map((item) => (
                <div key={item.plan} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className={`text-sm font-medium ${
                    item.plan === "FOUNDER" ? "text-violet-400" :
                    item.plan === "PRO" ? "text-amber-400" :
                    item.plan === "BUSINESS" ? "text-emerald-400" :
                    "text-slate-300"
                  }`}>{item.plan}</span>
                  <span className="text-sm font-medium text-white bg-white/10 px-2 py-0.5 rounded">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No plan data</p>
          )}
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-4">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}

// Crown icon component
function Crown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M3 20h18" />
    </svg>
  );
}
