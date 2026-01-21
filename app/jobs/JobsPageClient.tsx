"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  Send,
  FileCheck,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  MapPin,
  User,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { Job, JobStatus, JobWorkflowStatus, ClientStatus } from "@/lib/jobs";

interface JobsPageClientProps {
  jobs: Job[];
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
  stats: {
    total: number;
    pending: number;
    booked: number;
    completed: number;
    accepted: number;
    sent: number;
  };
  showRemovedNotice: boolean;
  showErrorNotice: boolean;
  clientEmailFilter: string | null;
  clientName: string | null;
}

// Status configurations with enhanced styling
const JOB_STATUS_CONFIG: Record<JobWorkflowStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
  pending_confirmation: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", label: "Awaiting" },
  booked: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Booked" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Done" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "Cancelled" },
};

const CLIENT_STATUS_CONFIG: Record<ClientStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", label: "Draft" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", label: "Sent" },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Accepted" },
  declined: { bg: "bg-rose-50", text: "text-rose-700", label: "Declined" },
  cancelled: { bg: "bg-amber-50", text: "text-amber-700", label: "Cancelled" },
};

const AI_STATUS_CONFIG: Record<JobStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", icon: <Clock className="w-3 h-3" />, label: "Draft" },
  ai_pending: { bg: "bg-amber-50", text: "text-amber-700", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Generating" },
  ai_complete: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle className="w-3 h-3" />, label: "Ready" },
  ai_failed: { bg: "bg-rose-50", text: "text-rose-700", icon: <AlertCircle className="w-3 h-3" />, label: "Failed" },
  pending_regeneration: { bg: "bg-orange-50", text: "text-orange-700", icon: <AlertCircle className="w-3 h-3" />, label: "Update" },
  generating: { bg: "bg-amber-50", text: "text-amber-700", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Updating" },
};

// Badge components
function JobStatusBadge({ status }: { status: JobWorkflowStatus }) {
  const config = JOB_STATUS_CONFIG[status] || JOB_STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = CLIENT_STATUS_CONFIG[status] || CLIENT_STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function AIStatusBadge({ status }: { status: JobStatus }) {
  const config = AI_STATUS_CONFIG[status] || AI_STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// Stat card component - premium design with visible icons
function StatCard({ 
  icon, 
  label, 
  value, 
  trend,
  accentColor = "amber",
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  trend?: { value: number; positive: boolean };
  accentColor?: "amber" | "emerald" | "blue" | "purple" | "slate";
}) {
  const colorConfig = {
    amber: { 
      bg: "bg-gradient-to-br from-amber-500 to-orange-500", 
      iconText: "text-white",
      accent: "from-amber-400 to-orange-400",
    },
    emerald: { 
      bg: "bg-gradient-to-br from-emerald-500 to-teal-500", 
      iconText: "text-white",
      accent: "from-emerald-400 to-teal-400",
    },
    blue: { 
      bg: "bg-gradient-to-br from-blue-500 to-indigo-500", 
      iconText: "text-white",
      accent: "from-blue-400 to-indigo-400",
    },
    purple: { 
      bg: "bg-gradient-to-br from-purple-500 to-violet-500", 
      iconText: "text-white",
      accent: "from-purple-400 to-violet-400",
    },
    slate: { 
      bg: "bg-gradient-to-br from-slate-600 to-slate-700", 
      iconText: "text-white",
      accent: "from-slate-500 to-slate-600",
    },
  };

  const config = colorConfig[accentColor];

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 p-4 overflow-hidden group hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      {/* Background accent circle */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${config.accent} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:opacity-15 transition-opacity`} />
      <div className="relative">
        {/* Icon container with solid gradient background */}
        <div className={`w-12 h-12 rounded-xl ${config.bg} shadow-lg flex items-center justify-center mb-3`}>
          <div className={`${config.iconText} [&>svg]:w-6 [&>svg]:h-6`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.positive && "rotate-180"}`} />
            {trend.value}% this week
          </div>
        )}
      </div>
    </div>
  );
}

// Format functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

// Job card component - premium design
function JobCard({ job, viewMode }: { job: Job; viewMode: "grid" | "list" }) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const hasSchedule = job.scheduledStartAt != null;

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Create a copy of "${job.title}"?\n\nThe new job will have the same details but will be reset to draft status.`
    );

    if (!confirmed) return;

    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/duplicate`, { method: "POST" });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to duplicate job");
        setIsDuplicating(false);
        return;
      }

      const data = await response.json();
      router.push(`/jobs/${data.jobId}`);
    } catch {
      alert("An unexpected error occurred while duplicating the job");
      setIsDuplicating(false);
    }
  };

  if (viewMode === "list") {
    return (
      <Link
        href={`/jobs/${job.id}`}
        className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 hover:shadow-md transition-all duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
              {job.title}
            </h3>
            <AIStatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {job.clientName && (
              <span className="flex items-center gap-1 truncate">
                <User className="w-3.5 h-3.5" />
                {job.clientName}
              </span>
            )}
            {job.address && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5" />
                {job.address}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <JobStatusBadge status={job.jobStatus || "pending"} />
            <span className="text-xs text-slate-400">{formatRelativeDate(job.createdAt)}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-amber-300 hover:shadow-xl transition-all duration-300"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors text-lg">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                {job.tradeType}
              </span>
              <AIStatusBadge status={job.status} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {job.clientName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span className="truncate">{job.clientName}</span>
            </div>
          )}
          {job.address && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate">{job.address}</span>
            </div>
          )}
        </div>

        {/* Status Row */}
        <div className="flex flex-wrap gap-2">
          <JobStatusBadge status={job.jobStatus || "pending"} />
          <ClientStatusBadge status={job.clientStatus || "draft"} />
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="text-sm">
          {hasSchedule ? (
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Calendar className="w-4 h-4" />
              {formatDate(job.scheduledStartAt!)}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">Not scheduled</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">{formatRelativeDate(job.createdAt)}</span>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            title="Duplicate job"
          >
            {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
          </button>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function JobsPageClient({
  jobs,
  pagination,
  stats,
  showRemovedNotice,
  showErrorNotice,
  clientEmailFilter,
  clientName,
}: JobsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "booked" | "completed">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.jobStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.address?.toLowerCase().includes(query) ||
          job.tradeType?.toLowerCase().includes(query) ||
          job.clientName?.toLowerCase().includes(query) ||
          job.clientEmail?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [jobs, searchQuery, statusFilter]);

  const hasFilters = searchQuery || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Notifications */}
        {showRemovedNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Job removed successfully</p>
              <p className="text-sm text-emerald-700 mt-1">The job has been removed from your list.</p>
            </div>
          </div>
        )}

        {showErrorNotice && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Job not available</p>
              <p className="text-sm text-amber-700 mt-1">The job you tried to access has been removed.</p>
            </div>
          </div>
        )}

        {/* Client Filter Banner */}
        {clientEmailFilter && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Filtered by client: {clientName || clientEmailFilter}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Showing {pagination.totalItems} job pack{pagination.totalItems === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Job Packs</h1>
              <p className="mt-2 text-slate-600 text-lg">
                AI-powered job scoping in seconds
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Create Job Pack
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Total Jobs" value={stats.total} accentColor="amber" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pending} accentColor="slate" />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Booked" value={stats.booked} accentColor="blue" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Completed" value={stats.completed} accentColor="emerald" />
          <StatCard icon={<Send className="w-5 h-5" />} label="Sent" value={stats.sent} accentColor="purple" />
          <StatCard icon={<FileCheck className="w-5 h-5" />} label="Accepted" value={stats.accepted} accentColor="emerald" />
        </div>

        {/* Search and Filters */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, address, client..."
                  className="block w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filters and View Toggle */}
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="appearance-none pl-4 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-amber-600" : "text-slate-500 hover:text-slate-700"}`}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-amber-600" : "text-slate-500 hover:text-slate-700"}`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            {hasFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-medium">{filteredJobs.length}</span> of <span className="font-medium">{jobs.length}</span> jobs
                  {searchQuery && <span className="text-slate-400"> matching "{searchQuery}"</span>}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Create your first Job Pack</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
              AI-powered job scoping that generates quotes, scope of work, and materials lists in seconds.
            </p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 text-lg"
            >
              <Plus className="w-5 h-5" />
              Create Job Pack
            </Link>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
            <p className="text-slate-500 mb-4">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Jobs Grid/List */
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && filteredJobs.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{" "}
                <span className="font-semibold">{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</span> of{" "}
                <span className="font-semibold">{pagination.totalItems}</span> jobs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    const newPage = pagination.page - 1;
                    if (newPage === 1) {
                      params.delete("page");
                    } else {
                      params.set("page", newPage.toString());
                    }
                    router.push(`/jobs?${params.toString()}`);
                  }}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl">
                  {pagination.page} / {pagination.totalPages}
                </div>
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", (pagination.page + 1).toString());
                    router.push(`/jobs?${params.toString()}`);
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {jobs.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-slate-500">
              Need to scope a new project?{" "}
              <Link href="/jobs/new" className="text-amber-600 hover:text-amber-700 font-semibold">
                Create a job pack
              </Link>{" "}
              and let AI handle the details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
