import { requireTradieUser } from "@/lib/auth";
import { getClientSummariesForUser } from "@/lib/clients";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import ClientsListClient from "./ClientsListClient";

// Authenticated page using requireTradieUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

interface ClientsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  // Use requireTradieUser to ensure only tradie/business/admin users can access
  // This will redirect clients to their dashboard automatically
  const user = await requireTradieUser();

  console.log("[clients] starting page render for user", user?.id);

  const params = await searchParams;
  const search = params.search || "";

  // Fetch client summaries derived from jobs
  let clientSummaries;
  try {
    clientSummaries = await getClientSummariesForUser(user.id);
  } catch (error) {
    console.error("[clients] Error fetching client summaries:", error);
    // Return empty results instead of crashing
    clientSummaries = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={user.verificationStatus || "unverified"} />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
        <p className="mt-2 text-slate-600">
          All clients you've created jobs for in OMNEXORA.
        </p>
      </div>

      {/* Clients List - Client-side search handled in ClientsListClient */}
      <ClientsListClient 
        initialClientSummaries={clientSummaries}
        initialSearch={search}
      />
    </div>
  );
}
