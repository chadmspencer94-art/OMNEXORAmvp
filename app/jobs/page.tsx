import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/authChecks";
import { getJobsForUserPaginated } from "@/lib/jobs";
import { getJobsForClientByEmail } from "@/lib/clients";
import { buildPagination } from "@/lib/pagination";
import JobsPageClient from "./JobsPageClient";

// Authenticated page using requireOnboardedUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

interface JobsPageProps {
  searchParams: Promise<{ removed?: string; error?: string; page?: string; clientEmail?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await requireOnboardedUser();
  
  // Redirect clients to their dashboard
  if (user.role === "client") {
    redirect("/client/dashboard");
  }

  const params = await searchParams;
  const { page } = buildPagination(params.page, 20);
  const showRemovedNotice = params.removed === "true";
  const showErrorNotice = params.error === "job_removed";
  const clientEmailFilter = params.clientEmail ? decodeURIComponent(params.clientEmail) : null;

  let jobsResult: Awaited<ReturnType<typeof getJobsForUserPaginated>>;
  let clientName: string | null = null;

  try {
    if (clientEmailFilter) {
      // Filter jobs by client email
      const allClientJobs = await getJobsForClientByEmail(user.id, clientEmailFilter);
      
      // Extract client name from the first job (best effort)
      if (allClientJobs.length > 0 && allClientJobs[0].clientName) {
        clientName = allClientJobs[0].clientName;
      }

      // Apply pagination manually since we're filtering
      const totalItems = allClientJobs.length;
      const totalPages = Math.ceil(totalItems / 20);
      const skip = (page - 1) * 20;
      const take = 20;
      const filteredJobs = allClientJobs.slice(skip, skip + take);

      jobsResult = {
        items: filteredJobs,
        totalItems,
        totalPages,
        page,
        pageSize: 20,
      };
    } else {
      // Normal pagination without client filter
      jobsResult = await getJobsForUserPaginated(user.id, false, page, 20);
    }
  } catch (error) {
    console.error("[jobs] Error fetching jobs:", error);
    // Return empty result instead of crashing
    jobsResult = {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: page,
      pageSize: 20,
    };
  }

  // Calculate stats from all jobs
  const allJobs = jobsResult.items;
  const stats = {
    total: jobsResult.totalItems,
    pending: allJobs.filter((j) => j.jobStatus === "pending" || !j.jobStatus).length,
    booked: allJobs.filter((j) => j.jobStatus === "booked").length,
    completed: allJobs.filter((j) => j.jobStatus === "completed").length,
    accepted: allJobs.filter((j) => j.clientStatus === "accepted").length,
    sent: allJobs.filter((j) => j.clientStatus === "sent").length,
  };

  return (
    <JobsPageClient
      jobs={jobsResult.items}
      pagination={jobsResult}
      stats={stats}
      showRemovedNotice={showRemovedNotice}
      showErrorNotice={showErrorNotice}
      clientEmailFilter={clientEmailFilter}
      clientName={clientName}
    />
  );
}
