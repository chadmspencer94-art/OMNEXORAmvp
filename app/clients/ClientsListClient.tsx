"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ClientSummary } from "@/lib/clients";
import type { JobWorkflowStatus } from "@/lib/jobs";
import { formatDateForDisplay } from "@/lib/format";

interface ClientsListClientProps {
  initialClientSummaries: ClientSummary[];
  initialSearch?: string;
}

// Badge component for job status (consistent with JobsList)
function JobStatusBadge({ status }: { status: JobWorkflowStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
        Unknown
      </span>
    );
  }

  const styles: Record<JobWorkflowStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    pending_confirmation: "bg-purple-100 text-purple-700",
    booked: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  const labels: Record<JobWorkflowStatus, string> = {
    pending: "Pending",
    pending_confirmation: "Awaiting Confirmation",
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

export default function ClientsListClient({ 
  initialClientSummaries, 
  initialSearch = "" 
}: ClientsListClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Client-side filtering by name or email
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialClientSummaries;
    }

    const query = searchQuery.toLowerCase().trim();
    return initialClientSummaries.filter((client) => {
      // Search in client name
      if (client.clientName?.toLowerCase().includes(query)) return true;
      
      // Search in client email
      if (client.clientEmail?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [initialClientSummaries, searchQuery]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Search is handled client-side, no need to submit
          }}
          className="w-full"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or email..."
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            />
          </div>
        </form>
      </div>

      {/* Empty State or Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchQuery ? "No clients found" : "No clients yet"}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchQuery
              ? "No clients match your search. Try a different term."
              : "No clients yet. Create a job to see your clients here."}
          </p>
          {!searchQuery && (
            <Link
              href="/jobs/new"
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Job
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Results Count */}
          {searchQuery && (
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
              <p className="text-sm text-slate-600">
                Showing {filteredClients.length} of {initialClientSummaries.length} client{filteredClients.length === 1 ? "" : "s"}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          )}

          {/* Clients Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Jobs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Last Job Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Last Job Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClients.map((client) => (
                  <tr key={client.clientKey} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-medium">
                        {client.clientName || <span className="text-slate-400 italic">No name</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.clientEmail ? (
                        <a
                          href={`mailto:${client.clientEmail}`}
                          className="text-slate-600 hover:text-amber-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.clientEmail}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No email</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {client.jobCount}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {client.lastJobDate ? formatDateForDisplay(client.lastJobDate) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <JobStatusBadge status={client.lastJobStatus} />
                    </td>
                    <td className="px-6 py-4">
                      {client.clientEmail && (
                        <Link
                          href={`/jobs?clientEmail=${encodeURIComponent(client.clientEmail)}`}
                          className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded"
                        >
                          View jobs
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

