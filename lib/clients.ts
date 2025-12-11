import { getJobsForUser, type Job, type JobWorkflowStatus } from "./jobs";

export type ClientSummary = {
  clientKey: string; // stable key, using clientEmail (normalized to lowercase)
  clientName: string | null; // best effort: most recent non-empty name
  clientEmail: string; // the grouping key (normalized)
  jobCount: number; // number of jobs for this client
  lastJobDate: string | null; // ISO string - most recent job createdAt or updatedAt
  lastJobStatus: JobWorkflowStatus | null; // status of the most recent job
};

/**
 * Gets aggregated client summaries for a tradie/business user
 * Groups jobs by clientEmail and aggregates statistics.
 * 
 * This function derives clients from existing job data - no separate database table needed.
 * Each client is identified by their email address (normalized to lowercase).
 */
export async function getClientSummariesForUser(userId: string): Promise<ClientSummary[]> {
  // Get all jobs for this user (excluding deleted)
  const jobs = await getJobsForUser(userId, false);

  // Filter out jobs without client email (can't group them)
  const jobsWithClients = jobs.filter(
    (job) => job.clientEmail && job.clientEmail.trim() !== ""
  );

  // Group by normalized email (lowercase)
  const clientMap = new Map<string, {
    name: string | null;
    email: string;
    jobs: Job[];
  }>();

  for (const job of jobsWithClients) {
    const normalizedEmail = job.clientEmail!.toLowerCase().trim();
    
    if (!clientMap.has(normalizedEmail)) {
      clientMap.set(normalizedEmail, {
        name: null, // Will be set later from most recent job
        email: normalizedEmail,
        jobs: [],
      });
    }

    const client = clientMap.get(normalizedEmail)!;
    client.jobs.push(job);
  }

  // Convert to ClientSummary array
  const summaries: ClientSummary[] = [];

  for (const [email, client] of clientMap.entries()) {
    // Find most recent job (by createdAt or updatedAt, whichever is later)
    let lastJobDate: string | null = null;
    let lastJobStatus: JobWorkflowStatus | null = null;
    let clientName: string | null = null;
    
    if (client.jobs.length > 0) {
      // Sort jobs by most recent date (createdAt or updatedAt, whichever is later)
      const sortedJobs = [...client.jobs].sort((a, b) => {
        const aDate = Math.max(
          new Date(a.createdAt).getTime(),
          new Date(a.updatedAt).getTime()
        );
        const bDate = Math.max(
          new Date(b.createdAt).getTime(),
          new Date(b.updatedAt).getTime()
        );
        return bDate - aDate; // Most recent first
      });
      
      const mostRecentJob = sortedJobs[0];
      const created = new Date(mostRecentJob.createdAt).getTime();
      const updated = new Date(mostRecentJob.updatedAt).getTime();
      lastJobDate = new Date(Math.max(created, updated)).toISOString();
      lastJobStatus = mostRecentJob.jobStatus || null;
      
      // Get client name from most recent job with a non-empty name (best effort)
      // Find the most recent job that has a clientName
      const jobsWithNames = sortedJobs.filter(j => j.clientName && j.clientName.trim() !== "");
      if (jobsWithNames.length > 0) {
        clientName = jobsWithNames[0].clientName!.trim();
      }
    }

    summaries.push({
      clientKey: email, // Use email as the key
      clientName: clientName, // Use name from most recent job
      clientEmail: client.email,
      jobCount: client.jobs.length,
      lastJobDate,
      lastJobStatus,
    });
  }

  // Sort by lastJobDate (most recent first), then by name
  summaries.sort((a, b) => {
    if (a.lastJobDate && b.lastJobDate) {
      return new Date(b.lastJobDate).getTime() - new Date(a.lastJobDate).getTime();
    }
    if (a.lastJobDate) return -1;
    if (b.lastJobDate) return 1;
    // Fallback to name
    const nameA = a.clientName || a.clientEmail || "";
    const nameB = b.clientName || b.clientEmail || "";
    return nameA.localeCompare(nameB);
  });

  return summaries;
}

/**
 * Gets all jobs for a specific client (by email) for a given user
 * Used for filtering jobs by client on the jobs page
 */
export async function getJobsForClientByEmail(
  userId: string,
  clientEmail: string
): Promise<Job[]> {
  const allJobs = await getJobsForUser(userId, false);
  
  const normalizedEmail = clientEmail.toLowerCase().trim();
  
  return allJobs
    .filter(
      (job) => job.clientEmail?.toLowerCase().trim() === normalizedEmail
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

