"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Loader2 } from "lucide-react";
import type { Job, JobStatus, JobWorkflowStatus, ClientStatus } from "@/lib/jobs";
import JobSearch from "./JobSearch";

function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    ai_pending: "bg-amber-100 text-amber-700",
    ai_complete: "bg-green-100 text-green-700",
    ai_failed: "bg-red-100 text-red-700",
    pending_regeneration: "bg-orange-100 text-orange-700",
    generating: "bg-amber-100 text-amber-700",
  };

  const labels: Record<JobStatus, string> = {
    draft: "Draft",
    ai_pending: "Generating...",
    ai_complete: "Complete",
    ai_failed: "Failed",
    pending_regeneration: "Needs Update",
    generating: "Regenerating...",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function JobWorkflowStatusBadge({ status }: { status: JobWorkflowStatus }) {
  const styles: Record<JobWorkflowStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    booked: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  const labels: Record<JobWorkflowStatus, string> = {
    pending: "Pending",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    declined: "bg-rose-100 text-rose-700",
    cancelled: "bg-amber-100 text-amber-700",
  };

  const labels: Record<ClientStatus, string> = {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    cancelled: "Cancelled",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function JobRow({ job }: { job: Job }) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const hasSchedule = job.scheduledStartAt != null;

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Create a copy of "${job.title}"?\n\nThe new job will have the same details but will be reset to draft status.`
    );

    if (!confirmed) {
      return;
    }

    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to duplicate job");
        setIsDuplicating(false);
        return;
      }

      const data = await response.json();
      // Navigate to the new job's detail page
      router.push(`/jobs/${data.jobId}`);
    } catch (err) {
      alert("An unexpected error occurred while duplicating the job");
      setIsDuplicating(false);
    }
  };
  
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-slate-900 font-medium">{job.title}</span>
          {job.address && (
            <span className="text-slate-500 text-sm truncate max-w-xs">{job.address}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-600">{job.tradeType}</td>
      <td className="px-6 py-4">
        <JobWorkflowStatusBadge status={job.jobStatus || "pending"} />
      </td>
      <td className="px-6 py-4">
        <ClientStatusBadge status={job.clientStatus || "draft"} />
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-6 py-4">
        {hasSchedule ? (
          <div className="flex flex-col">
            <span className="text-slate-900 text-sm font-medium">
              {formatDateTime(job.scheduledStartAt!)}
            </span>
            {job.scheduledEndAt && (
              <span className="text-slate-500 text-xs">
                to {formatDateTime(job.scheduledEndAt)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-sm">Not scheduled</span>
        )}
      </td>
      <td className="px-6 py-4 text-slate-600">{formatDate(job.createdAt)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${job.id}`}
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            View →
          </Link>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate job"
          >
            {isDuplicating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Copying...</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Duplicate</span>
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

interface JobsListProps {
  jobs: Job[];
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}

export default function JobsList({ jobs, pagination }: JobsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "scheduled" | "unscheduled">("all");

  // Filter jobs based on search query and schedule filter
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Apply schedule filter
    if (scheduleFilter === "scheduled") {
      filtered = filtered.filter((job) => job.scheduledStartAt != null);
    } else if (scheduleFilter === "unscheduled") {
      filtered = filtered.filter((job) => job.scheduledStartAt == null);
    }

    // Apply search query
    if (!searchQuery.trim()) {
      return filtered;
    }

    const query = searchQuery.toLowerCase().trim();
    return filtered.filter((job) => {
      // Search in title
      if (job.title?.toLowerCase().includes(query)) return true;
      
      // Search in address
      if (job.address?.toLowerCase().includes(query)) return true;
      
      // Search in trade type
      if (job.tradeType?.toLowerCase().includes(query)) return true;
      
      // Search in property type
      if (job.propertyType?.toLowerCase().includes(query)) return true;
      
      // Search in client name
      if (job.clientName?.toLowerCase().includes(query)) return true;
      
      // Search in client email
      if (job.clientEmail?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [jobs, searchQuery, scheduleFilter]);

  if (jobs.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search Bar and Filters */}
      <div className="px-6 py-4 border-b border-slate-200 space-y-3">
        <JobSearch
          onSearch={setSearchQuery}
          placeholder="Search by title, address, trade type, client..."
        />
        <div className="flex items-center gap-3">
          <label htmlFor="schedule-filter" className="text-sm font-medium text-slate-700">
            Filter:
          </label>
          <select
            id="schedule-filter"
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value as "all" | "scheduled" | "unscheduled")}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            <option value="all">All jobs</option>
            <option value="scheduled">Scheduled only</option>
            <option value="unscheduled">Unscheduled only</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {(searchQuery || scheduleFilter !== "all") && (
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            {filteredJobs.length === 0 ? (
              <>No jobs found matching your filters</>
            ) : (
              <>
                Showing {filteredJobs.length} of {pagination ? pagination.totalItems : jobs.length} job{filteredJobs.length === 1 ? "" : "s"}
                {searchQuery && ` matching "${searchQuery}"`}
              </>
            )}
          </p>
        </div>
      )}

      {/* Jobs Table */}
      <div className="overflow-x-auto">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs found</h3>
            <p className="text-slate-500 text-sm">
              Try adjusting your search terms or clear the search to see all jobs.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Job Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  AI Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{" "}
              <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</span> of{" "}
              <span className="font-medium">{pagination.totalItems}</span> jobs
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
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <div className="text-sm text-slate-700 px-3 py-2">
                Page <span className="font-medium">{pagination.page}</span> of{" "}
                <span className="font-medium">{pagination.totalPages}</span>
              </div>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", (pagination.page + 1).toString());
                  router.push(`/jobs?${params.toString()}`);
                }}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

