import { getJobsForUser, type Job } from "./jobs";

export type ClientSummary = {
  clientKey: string; // stable key, using clientEmail (normalized to lowercase)
  name: string | null;
  email: string | null;
  phone: string | null; // Not currently stored, but reserved for future

  totalJobs: number;
  acceptedJobs: number;
  declinedJobs: number;
  completedJobs: number;

  lastJobDate: string | null; // ISO string
};

/**
 * Gets aggregated client summaries for a tradie/business user
 * Groups jobs by clientEmail and aggregates statistics
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
    email: string | null;
    phone: string | null;
    jobs: Job[];
  }>();

  for (const job of jobsWithClients) {
    const normalizedEmail = job.clientEmail!.toLowerCase().trim();
    
    if (!clientMap.has(normalizedEmail)) {
      clientMap.set(normalizedEmail, {
        name: job.clientName || null,
        email: normalizedEmail,
        phone: null, // Not currently stored on jobs
        jobs: [],
      });
    }

    const client = clientMap.get(normalizedEmail)!;
    client.jobs.push(job);

    // Update name if we find a more recent one (or if current is null)
    if (!client.name && job.clientName) {
      client.name = job.clientName;
    }
  }

  // Convert to ClientSummary array
  const summaries: ClientSummary[] = [];

  for (const [email, client] of clientMap.entries()) {
    const acceptedJobs = client.jobs.filter(
      (j) => j.clientStatus === "accepted"
    ).length;

    const declinedJobs = client.jobs.filter(
      (j) => j.clientStatus === "declined"
    ).length;

    const completedJobs = client.jobs.filter(
      (j) => j.jobStatus === "completed"
    ).length;

    // Find most recent job date
    let lastJobDate: string | null = null;
    if (client.jobs.length > 0) {
      const dates = client.jobs.map((j) => {
        const created = new Date(j.createdAt).getTime();
        const updated = new Date(j.updatedAt).getTime();
        return Math.max(created, updated);
      });
      lastJobDate = new Date(Math.max(...dates)).toISOString();
    }

    summaries.push({
      clientKey: email, // Use email as the key
      name: client.name,
      email: client.email,
      phone: client.phone,
      totalJobs: client.jobs.length,
      acceptedJobs,
      declinedJobs,
      completedJobs,
      lastJobDate,
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
    const nameA = a.name || a.email || "";
    const nameB = b.name || b.email || "";
    return nameA.localeCompare(nameB);
  });

  return summaries;
}

/**
 * Gets all jobs for a specific client (by email)
 */
export async function getJobsForClient(
  userId: string,
  clientEmail: string
): Promise<Job[]> {
  const allJobs = await getJobsForUser(userId, false);
  
  const normalizedEmail = clientEmail.toLowerCase().trim();
  
  return allJobs.filter(
    (job) => job.clientEmail?.toLowerCase().trim() === normalizedEmail
  );
}

