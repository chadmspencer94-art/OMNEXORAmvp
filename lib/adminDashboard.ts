/**
 * Admin Dashboard Data Fetching
 * 
 * Provides server-side data aggregation for the admin dashboard overview.
 */

import { getPrisma } from "./prisma";
import { kv } from "./kv";
import { getAllFeedback } from "./feedback";
import type { Job } from "./jobs";

export type AdminDashboardData = {
  users: {
    totalUsers: number;
    totalClients: number;
    totalTradies: number;
    totalAdmins: number;
    usersByPlan: { planTier: string; count: number }[];
    usersLast7Days: number;
    usersLast30Days: number;
  };
  jobs: {
    totalJobs: number;
    jobsLast7Days: number;
    jobsLast30Days: number;
    jobsByStatus: { status: string; count: number }[];
    jobsByClientStatus: { clientStatus: string; count: number }[];
  };
  verifications: {
    pendingCount: number;
    pendingList: Array<{
      id: string;
      userId: string;
      businessName: string | null;
      primaryTrade: string | null;
      createdAt: Date;
    }>;
  };
  feedback: {
    openCount: number;
    recentOpen: Array<{
      id: string;
      type: string | null;
      title: string;
      createdAt: Date;
      userEmail: string | null;
    }>;
  };
};

/**
 * Fetches all admin dashboard data
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const prisma = getPrisma();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ============================================================================
  // User Metrics
  // ============================================================================
  let totalUsers = 0;
  let totalClients = 0;
  let totalTradies = 0;
  let totalAdmins = 0;
  let usersLast7Days = 0;
  let usersLast30Days = 0;
  let usersByPlan: { planTier: string; count: number }[] = [];

  try {
    const [
      usersCount,
      clientsCount,
      tradiesCount,
      adminsCount,
      users7Days,
      users30Days,
      allUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "client" } }),
      prisma.user.count({
        where: {
          role: {
            in: ["tradie", "builder", "supplier"],
          },
        },
      }),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.findMany({
        select: { planTier: true },
      }),
    ]);

    totalUsers = usersCount;
    totalClients = clientsCount;
    totalTradies = tradiesCount;
    totalAdmins = adminsCount;
    usersLast7Days = users7Days;
    usersLast30Days = users30Days;

    // Group users by plan tier
    const planTierCounts: Record<string, number> = {};
    allUsers.forEach((user) => {
      const tier = user.planTier || "FREE";
      planTierCounts[tier] = (planTierCounts[tier] || 0) + 1;
    });

    usersByPlan = Object.entries(planTierCounts).map(([planTier, count]) => ({
      planTier,
      count,
    }));
  } catch (error) {
    console.error("[adminDashboard] Error fetching user metrics:", error);
  }

  // ============================================================================
  // Job Metrics (from KV store)
  // ============================================================================
  let totalJobs = 0;
  let jobsLast7Days = 0;
  let jobsLast30Days = 0;
  let jobsByStatus: { status: string; count: number }[] = [];
  let jobsByClientStatus: { clientStatus: string; count: number }[] = [];

  try {
    // Get all users to fetch their jobs
    const allUserIds = await prisma.user.findMany({
      select: { id: true },
    });

    // Fetch all jobs from KV
    const allJobs: Job[] = [];
    for (const user of allUserIds) {
      const userJobsKey = `user:${user.id}:jobs`;
      const jobIds = (await kv.lrange(userJobsKey, 0, -1)) as string[] | null;
      if (jobIds && jobIds.length > 0) {
        const jobs = await Promise.all(
          jobIds.map((id) => kv.get(`job:${id}`) as Promise<Job | null>)
        );
        allJobs.push(...jobs.filter((job): job is Job => job !== null && !job.isDeleted));
      }
    }

    totalJobs = allJobs.length;

    // Filter jobs by date
    jobsLast7Days = allJobs.filter(
      (job) => new Date(job.createdAt) >= sevenDaysAgo
    ).length;
    jobsLast30Days = allJobs.filter(
      (job) => new Date(job.createdAt) >= thirtyDaysAgo
    ).length;

    // Group jobs by status
    const statusCounts: Record<string, number> = {};
    allJobs.forEach((job) => {
      const status = job.jobStatus || job.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    jobsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Group jobs by client status
    const clientStatusCounts: Record<string, number> = {};
    allJobs.forEach((job) => {
      const clientStatus = job.clientStatus || "draft";
      clientStatusCounts[clientStatus] = (clientStatusCounts[clientStatus] || 0) + 1;
    });

    jobsByClientStatus = Object.entries(clientStatusCounts).map(
      ([clientStatus, count]) => ({
        clientStatus,
        count,
      })
    );
  } catch (error) {
    console.error("[adminDashboard] Error fetching job metrics:", error);
  }

  // ============================================================================
  // Verification Queue
  // ============================================================================
  let pendingCount = 0;
  let pendingVerifications: Array<{
    id: string;
    userId: string;
    businessName: string | null;
    primaryTrade: string | null;
    createdAt: Date;
  }> = [];

  try {
    const pendingVerifs = await prisma.userVerification.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        userId: true,
        businessName: true,
        primaryTrade: true,
        createdAt: true,
      },
    });

    pendingCount = await prisma.userVerification.count({
      where: { status: "pending" },
    });

    pendingVerifications = pendingVerifs.map((v) => ({
      id: v.id,
      userId: v.userId,
      businessName: v.businessName,
      primaryTrade: v.primaryTrade,
      createdAt: v.createdAt,
    }));
  } catch (error) {
    console.error("[adminDashboard] Error fetching verification queue:", error);
  }

  // ============================================================================
  // Feedback Queue
  // ============================================================================
  let openCount = 0;
  let recentOpen: Array<{
    id: string;
    type: string | null;
    title: string;
    createdAt: Date;
    userEmail: string | null;
  }> = [];

  try {
    const allFeedback = await getAllFeedback();
    const openFeedback = allFeedback.filter(
      (f) => f.status === "OPEN" || f.status === "IN_PROGRESS" || !f.resolved
    );

    openCount = openFeedback.length;
    recentOpen = openFeedback
      .slice(0, 10)
      .map((f) => ({
        id: f.id,
        type: f.category || null,
        title: f.message.substring(0, 100) + (f.message.length > 100 ? "..." : ""),
        createdAt: new Date(f.createdAt),
        userEmail: f.userEmail || null,
      }));
  } catch (error) {
    console.error("[adminDashboard] Error fetching feedback queue:", error);
  }

  return {
    users: {
      totalUsers,
      totalClients,
      totalTradies,
      totalAdmins,
      usersByPlan,
      usersLast7Days,
      usersLast30Days,
    },
    jobs: {
      totalJobs,
      jobsLast7Days,
      jobsLast30Days,
      jobsByStatus,
      jobsByClientStatus,
    },
    verifications: {
      pendingCount,
      pendingList: pendingVerifications,
    },
    feedback: {
      openCount,
      recentOpen,
    },
  };
}

