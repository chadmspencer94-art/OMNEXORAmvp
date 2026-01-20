import { requireTradieUser } from "@/lib/auth";
import { getClientSummariesForUser, type ClientSummary } from "@/lib/clients";
import ClientsPageClient from "./ClientsPageClient";

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

  const params = await searchParams;
  const search = params.search || "";

  // Fetch client summaries derived from jobs
  let clientSummaries: ClientSummary[];
  try {
    clientSummaries = await getClientSummariesForUser(user.id);
  } catch (error) {
    console.error("[clients] Error fetching client summaries:", error);
    // Return empty results instead of crashing
    clientSummaries = [];
  }

  // Calculate stats
  const totalClients = clientSummaries.length;
  const activeClients = clientSummaries.filter(
    (c) => c.lastJobStatus && !["completed", "cancelled"].includes(c.lastJobStatus)
  ).length;
  const totalJobs = clientSummaries.reduce((acc, c) => acc + c.jobCount, 0);

  return (
    <ClientsPageClient
      clientSummaries={clientSummaries}
      initialSearch={search}
      stats={{
        totalClients,
        activeClients,
        totalJobs,
      }}
    />
  );
}
