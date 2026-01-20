"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  UserCheck,
  Briefcase,
  Plus,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Filter,
  SlidersHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";
import type { ClientSummary } from "@/lib/clients";
import type { JobWorkflowStatus } from "@/lib/jobs";
import { formatDateForDisplay } from "@/lib/format";

interface ClientsPageClientProps {
  clientSummaries: ClientSummary[];
  initialSearch?: string;
  stats: {
    totalClients: number;
    activeClients: number;
    totalJobs: number;
  };
}

// Status badge component
function JobStatusBadge({ status }: { status: JobWorkflowStatus | null }) {
  if (!status) return null;

  const config: Record<JobWorkflowStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
    },
    pending_confirmation: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Awaiting",
    },
    booked: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: <Calendar className="w-3 h-3" />,
      label: "Booked",
    },
    completed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: <CheckCircle className="w-3 h-3" />,
      label: "Completed",
    },
    cancelled: {
      bg: "bg-slate-100",
      text: "text-slate-500",
      icon: <XCircle className="w-3 h-3" />,
      label: "Cancelled",
    },
  };

  const c = config[status] || { bg: "bg-slate-100", text: "text-slate-600", icon: null, label: status };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// Stat card component
function StatCard({ 
  icon, 
  label, 
  value, 
  color = "amber" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color?: "amber" | "emerald" | "blue" | "purple";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

// Generate avatar initials
function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// Generate avatar color based on name/email
function getAvatarColor(key: string): string {
  const colors = [
    "bg-gradient-to-br from-amber-400 to-orange-500",
    "bg-gradient-to-br from-emerald-400 to-teal-500",
    "bg-gradient-to-br from-blue-400 to-indigo-500",
    "bg-gradient-to-br from-purple-400 to-pink-500",
    "bg-gradient-to-br from-rose-400 to-red-500",
    "bg-gradient-to-br from-cyan-400 to-blue-500",
  ];
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Client card component
function ClientCard({ client }: { client: ClientSummary }) {
  const initials = getInitials(client.clientName, client.clientEmail);
  const avatarColor = getAvatarColor(client.clientEmail);

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-amber-300 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
          {initials}
        </div>

        {/* Client Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                {client.clientName || <span className="text-slate-400 italic">Unnamed Client</span>}
              </h3>
              <a
                href={`mailto:${client.clientEmail}`}
                className="text-sm text-slate-500 hover:text-amber-600 truncate block mt-0.5 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {client.clientEmail}
              </a>
            </div>
            <JobStatusBadge status={client.lastJobStatus} />
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{client.jobCount}</span>
              <span className="text-slate-400">{client.jobCount === 1 ? "job" : "jobs"}</span>
            </div>
            {client.lastJobDate && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDateForDisplay(client.lastJobDate)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
            <Link
              href={`/jobs?clientEmail=${encodeURIComponent(client.clientEmail)}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              View Jobs
            </Link>
            <a
              href={`mailto:${client.clientEmail}`}
              className="inline-flex items-center justify-center w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Send Email"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPageClient({
  clientSummaries,
  initialSearch = "",
  stats,
}: ClientsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "jobs">("recent");

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let results = [...clientSummaries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(
        (client) =>
          client.clientName?.toLowerCase().includes(query) ||
          client.clientEmail?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        results = results.filter(
          (c) => c.lastJobStatus && !["completed", "cancelled"].includes(c.lastJobStatus)
        );
      } else if (statusFilter === "completed") {
        results = results.filter((c) => c.lastJobStatus === "completed");
      }
    }

    // Sort
    if (sortBy === "name") {
      results.sort((a, b) => {
        const nameA = a.clientName || a.clientEmail || "";
        const nameB = b.clientName || b.clientEmail || "";
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === "jobs") {
      results.sort((a, b) => b.jobCount - a.jobCount);
    }
    // "recent" is default sort from backend

    return results;
  }, [clientSummaries, searchQuery, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Clients</h1>
              <p className="mt-1 text-slate-600">
                Manage your client relationships and job history
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/30"
            >
              <Plus className="w-5 h-5" />
              New Job
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Clients"
            value={stats.totalClients}
            color="amber"
          />
          <StatCard
            icon={<UserCheck className="w-6 h-6" />}
            label="Active"
            value={stats.activeClients}
            color="emerald"
          />
          <StatCard
            icon={<Briefcase className="w-6 h-6" />}
            label="Total Jobs"
            value={stats.totalJobs}
            color="blue"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients by name or email..."
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "name" | "jobs")}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name A-Z</option>
                  <option value="jobs">Most Jobs</option>
                </select>
                <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Results Count */}
          {(searchQuery || statusFilter !== "all") && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Showing {filteredClients.length} of {clientSummaries.length} client
                {clientSummaries.length === 1 ? "" : "s"}
                {searchQuery && (
                  <span className="text-slate-400"> matching &quot;{searchQuery}&quot;</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {clientSummaries.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No clients yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Your clients will appear here automatically when you create jobs for them.
            </p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Your First Job
            </Link>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-500 mb-4">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Clients Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard key={client.clientKey} client={client} />
            ))}
          </div>
        )}

        {/* Footer Help */}
        {clientSummaries.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Clients are automatically created when you add them to jobs.{" "}
              <Link href="/jobs/new" className="text-amber-600 hover:text-amber-700 font-medium">
                Create a new job
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
