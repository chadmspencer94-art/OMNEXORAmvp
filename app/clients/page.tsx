import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOnboardedUser, isClient } from "@/lib/authChecks";
import { getClientsForUser } from "@/lib/clientCrm";
import { formatDateTimeForDisplay } from "@/lib/format";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import ClientListSearch from "./ClientListSearch";

// Authenticated page using requireOnboardedUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

interface ClientsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await requireOnboardedUser();

  console.log("[clients] starting page render for user", user?.id);

  // Redirect clients away from CRM
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  // Fetch clients for this user
  let clients: Awaited<ReturnType<typeof getClientsForUser>>["clients"];
  let total: number;
  let totalPages: number;
  try {
    const result = await getClientsForUser(user.id, {
      search,
      page,
      pageSize: 20,
    });
    clients = result.clients;
    total = result.total;
    totalPages = result.totalPages;
  } catch (error) {
    console.error("[clients] Error fetching clients:", error);
    // Return empty results instead of crashing
    clients = [];
    total = 0;
    totalPages = 0;
  }

  // Extract suburb from address helper (reused from elsewhere)
  const extractSuburb = (address?: string | null): string => {
    if (!address) return "";
    const postcodeMatch = address.match(/\b(\d{4})\b/);
    if (postcodeMatch) {
      const beforePostcode = address.substring(0, address.indexOf(postcodeMatch[1])).trim();
      const words = beforePostcode.split(/[,\s]+/);
      if (words.length > 0) {
        return words[words.length - 1];
      }
    }
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={user.verificationStatus || "unverified"} />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
        <p className="mt-2 text-slate-600">
          Manage your client contacts and view job history
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <ClientListSearch initialSearch={search} />
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
            <p className="text-slate-500 mb-6">
              {search
                ? "No clients match your search. Try a different term."
                : "Clients will appear here when you create jobs with client details."}
            </p>
            {!search && (
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
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {total} {total === 1 ? "Client" : "Clients"}
                </h2>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
                        {client.company && (
                          <span className="text-sm text-slate-500">({client.company})</span>
                        )}
                        {client.tags && (
                          <div className="flex flex-wrap gap-1">
                            {client.tags.split(",").map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-slate-900 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {client.email}
                          </a>
                        )}
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-slate-900 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {client.phone}
                          </a>
                        )}
                        {(client.suburb || client.state) && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {[client.suburb, client.state, client.postcode].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/clients?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/clients?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
