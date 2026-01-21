import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/admin/advanced-analytics
 * Returns comprehensive platform analytics for admins
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const prisma = getPrisma();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // ===== USER METRICS =====
    const totalUsers = await prisma.user.count();
    const usersLast7Days = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const usersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const verifiedEmails = await prisma.user.count({
      where: { emailVerifiedAt: { not: null } },
    });
    const verifiedBusinesses = await prisma.user.count({
      where: { verificationStatus: "verified" },
    });
    const activeUsersLast7Days = await prisma.user.count({
      where: { lastActivityAt: { gte: sevenDaysAgo } },
    });
    const activeUsersLast30Days = await prisma.user.count({
      where: { lastActivityAt: { gte: thirtyDaysAgo } },
    });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });

    // Users by plan tier
    const usersByPlan = await prisma.user.groupBy({
      by: ["planTier"],
      _count: { id: true },
    });

    // Users by trade
    const usersByTrade = await prisma.user.groupBy({
      by: ["primaryTrade"],
      _count: { id: true },
      where: { primaryTrade: { not: null } },
    });

    // Users by state
    const usersByState = await prisma.user.groupBy({
      by: ["businessState"],
      _count: { id: true },
      where: { businessState: { not: null } },
    });

    // Signup sources
    const usersBySignupSource = await prisma.user.groupBy({
      by: ["signupSource"],
      _count: { id: true },
      where: { signupSource: { not: null } },
    });

    // ===== JOB METRICS =====
    const totalJobs = await prisma.job.count();
    const jobsLast7Days = await prisma.job.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const jobsLast30Days = await prisma.job.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Jobs by status
    const jobsByStatus = await prisma.job.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Average jobs per user
    const avgJobsPerUser = totalUsers > 0 ? totalJobs / totalUsers : 0;

    // ===== QUOTE METRICS =====
    const totalQuotes = await prisma.quote.count();
    const quotesLast30Days = await prisma.quote.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Quotes by status
    const quotesByStatus = await prisma.quote.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Calculate conversion rates
    const acceptedQuotes = quotesByStatus.find(q => q.status === "ACCEPTED")?._count?.id || 0;
    const sentQuotes = quotesByStatus.find(q => q.status === "SENT")?._count?.id || 0;
    const declinedQuotes = quotesByStatus.find(q => q.status === "DECLINED")?._count?.id || 0;
    const totalSentOrFinalized = sentQuotes + acceptedQuotes + declinedQuotes;
    const quoteConversionRate = totalSentOrFinalized > 0 ? (acceptedQuotes / totalSentOrFinalized) * 100 : 0;

    // Total quote value
    const quoteValues = await prisma.quote.aggregate({
      _sum: { totalAmount: true },
      where: { status: "ACCEPTED" },
    });
    const totalAcceptedQuoteValue = quoteValues._sum.totalAmount || 0;

    // ===== BUSINESS SCORE METRICS =====
    const businessScores = await prisma.user.findMany({
      where: { businessScore: { gt: 0 } },
      select: { businessScore: true, primaryTrade: true },
    });

    const avgBusinessScore = businessScores.length > 0
      ? businessScores.reduce((sum, u) => sum + u.businessScore, 0) / businessScores.length
      : 0;

    // Score distribution
    const scoreDistribution = {
      platinum: businessScores.filter(u => u.businessScore >= 90).length,
      gold: businessScores.filter(u => u.businessScore >= 75 && u.businessScore < 90).length,
      silver: businessScores.filter(u => u.businessScore >= 60 && u.businessScore < 75).length,
      bronze: businessScores.filter(u => u.businessScore >= 40 && u.businessScore < 60).length,
      starter: businessScores.filter(u => u.businessScore < 40).length,
    };

    // Average score by trade
    const scoresByTrade: Record<string, { total: number; count: number }> = {};
    businessScores.forEach(u => {
      if (u.primaryTrade) {
        if (!scoresByTrade[u.primaryTrade]) {
          scoresByTrade[u.primaryTrade] = { total: 0, count: 0 };
        }
        scoresByTrade[u.primaryTrade].total += u.businessScore;
        scoresByTrade[u.primaryTrade].count += 1;
      }
    });
    const avgScoreByTrade = Object.entries(scoresByTrade).map(([trade, data]) => ({
      trade,
      avgScore: Math.round(data.total / data.count),
      count: data.count,
    })).sort((a, b) => b.avgScore - a.avgScore);

    // ===== DOCUMENT METRICS =====
    const totalSafetyDocs = await prisma.safetyDocument.count();
    const safetyDocsLast30Days = await prisma.safetyDocument.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // ===== MATERIALS & TEMPLATES =====
    const totalMaterials = await prisma.materialItem.count({ where: { isArchived: false } });
    const totalTemplates = await prisma.jobTemplate.count();
    const totalClients = await prisma.client.count();

    // ===== GROWTH TRENDS =====
    // Get daily signups for last 30 days
    const dailySignups = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM User 
      WHERE createdAt >= ${thirtyDaysAgo.toISOString()}
      GROUP BY DATE(createdAt) 
      ORDER BY date ASC
    `;

    // Get daily jobs for last 30 days
    const dailyJobs = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM Job 
      WHERE createdAt >= ${thirtyDaysAgo.toISOString()}
      GROUP BY DATE(createdAt) 
      ORDER BY date ASC
    `;

    // ===== TOP PERFORMERS =====
    const topUsersByJobs = await prisma.user.findMany({
      where: { totalJobs: { gt: 0 } },
      orderBy: { totalJobs: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        businessName: true,
        primaryTrade: true,
        totalJobs: true,
        businessScore: true,
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        last7Days: usersLast7Days,
        last30Days: usersLast30Days,
        verifiedEmails,
        verifiedBusinesses,
        activeUsersLast7Days,
        activeUsersLast30Days,
        emailVerificationRate: totalUsers > 0 ? (verifiedEmails / totalUsers) * 100 : 0,
        businessVerificationRate: totalUsers > 0 ? (verifiedBusinesses / totalUsers) * 100 : 0,
        byRole: usersByRole.map(r => ({ role: r.role, count: r._count.id })),
        byPlan: usersByPlan.map(p => ({ plan: p.planTier, count: p._count.id })),
        byTrade: usersByTrade.map(t => ({ trade: t.primaryTrade, count: t._count.id })),
        byState: usersByState.map(s => ({ state: s.businessState, count: s._count.id })),
        bySignupSource: usersBySignupSource.map(s => ({ source: s.signupSource, count: s._count.id })),
      },
      jobs: {
        total: totalJobs,
        last7Days: jobsLast7Days,
        last30Days: jobsLast30Days,
        avgPerUser: Math.round(avgJobsPerUser * 10) / 10,
        byStatus: jobsByStatus.map(s => ({ status: s.status, count: s._count.id })),
      },
      quotes: {
        total: totalQuotes,
        last30Days: quotesLast30Days,
        byStatus: quotesByStatus.map(s => ({ status: s.status, count: s._count.id })),
        conversionRate: Math.round(quoteConversionRate * 10) / 10,
        totalAcceptedValue: totalAcceptedQuoteValue,
      },
      businessScores: {
        average: Math.round(avgBusinessScore),
        distribution: scoreDistribution,
        byTrade: avgScoreByTrade,
        totalWithScore: businessScores.length,
      },
      documents: {
        safetyDocs: {
          total: totalSafetyDocs,
          last30Days: safetyDocsLast30Days,
        },
      },
      engagement: {
        totalMaterials,
        totalTemplates,
        totalClients,
      },
      trends: {
        dailySignups: dailySignups.map(d => ({ date: d.date, count: Number(d.count) })),
        dailyJobs: dailyJobs.map(d => ({ date: d.date, count: Number(d.count) })),
      },
      topPerformers: topUsersByJobs,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
