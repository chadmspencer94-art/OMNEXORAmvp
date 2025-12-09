import { getJobsForUser, type Job, type ClientStatus } from "./jobs";

export type UserJobAnalytics = {
  totalJobs: number;
  jobsLast30Days: number;
  jobsLast7Days: number;
  quoteCounts: {
    draft: number;
    sent: number;
    accepted: number;
    declined: number;
    cancelled: number;
  };
  // Note: Revenue metrics skipped for now as Job model uses aiQuote (text) not numeric total
};

/**
 * Computes analytics for a single tradie/business user
 * @param userId - The user's ID
 * @returns Analytics object with job counts and quote status breakdown
 */
export async function getUserJobAnalytics(userId: string): Promise<UserJobAnalytics> {
  // Get all jobs for this user (excludes deleted jobs by default)
  const allJobs = await getJobsForUser(userId, false);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Initialize quote counts
  const quoteCounts = {
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    cancelled: 0,
  };

  let jobsLast30Days = 0;
  let jobsLast7Days = 0;

  // Process each job
  for (const job of allJobs) {
    // Count jobs by creation date
    const createdAt = new Date(job.createdAt);
    if (createdAt >= thirtyDaysAgo) {
      jobsLast30Days++;
    }
    if (createdAt >= sevenDaysAgo) {
      jobsLast7Days++;
    }

    // Count quotes by client status
    const clientStatus: ClientStatus = job.clientStatus || "draft";
    switch (clientStatus) {
      case "draft":
        quoteCounts.draft++;
        break;
      case "sent":
        quoteCounts.sent++;
        break;
      case "accepted":
        quoteCounts.accepted++;
        break;
      case "declined":
        quoteCounts.declined++;
        break;
      case "cancelled":
        quoteCounts.cancelled++;
        break;
    }
  }

  return {
    totalJobs: allJobs.length,
    jobsLast30Days,
    jobsLast7Days,
    quoteCounts,
  };
}

