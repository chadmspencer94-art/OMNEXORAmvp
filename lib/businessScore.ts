/**
 * Business Score Calculation System
 * 
 * Calculates a comprehensive business score based on multiple factors:
 * - Profile completeness
 * - Job performance metrics
 * - Quote conversion rates
 * - Response times
 * - Verification status
 * - Platform engagement
 * 
 * This score contributes to the public rating system used for future features.
 */

import { getPrisma } from "./prisma";
import { getJobsForUser, type Job } from "./jobs";
import { getTradeComplianceNotes } from "./tradeProfiles";

// Score weights for different factors
const SCORE_WEIGHTS = {
  profileCompleteness: 0.20,      // 20%
  quoteConversion: 0.25,          // 25%
  jobVolume: 0.15,                // 15%
  responseTime: 0.10,             // 10%
  verification: 0.15,             // 15%
  platformEngagement: 0.10,       // 10%
  complianceReadiness: 0.05,      // 5%
};

// Rating tiers based on score
export const RATING_TIERS = {
  PLATINUM: { min: 90, label: "Platinum", color: "from-slate-400 to-slate-600", textColor: "text-slate-700" },
  GOLD: { min: 75, label: "Gold", color: "from-amber-400 to-amber-600", textColor: "text-amber-700" },
  SILVER: { min: 60, label: "Silver", color: "from-slate-300 to-slate-400", textColor: "text-slate-600" },
  BRONZE: { min: 40, label: "Bronze", color: "from-orange-300 to-orange-500", textColor: "text-orange-700" },
  STARTER: { min: 0, label: "Starter", color: "from-slate-200 to-slate-300", textColor: "text-slate-500" },
} as const;

export type RatingTier = keyof typeof RATING_TIERS;

export interface ProfileCompletenessBreakdown {
  businessName: boolean;
  abn: boolean;
  primaryTrade: boolean;
  businessAddress: boolean;
  contactInfo: boolean;
  rates: boolean;
  serviceArea: boolean;
  signature: boolean;
  percentage: number;
}

export interface QuotePerformanceMetrics {
  totalQuotes: number;
  acceptedQuotes: number;
  declinedQuotes: number;
  pendingQuotes: number;
  conversionRate: number;
  avgResponseDays: number;
}

export interface JobPerformanceMetrics {
  totalJobs: number;
  completedJobs: number;
  jobsLast30Days: number;
  jobsLast90Days: number;
  variationRate: number;
  avgVariationValue: number;
}

export interface EngagementMetrics {
  loginFrequency: number;        // Days active in last 30 days
  documentsGenerated: number;    // Total documents generated
  materialsLibrarySize: number;  // Number of materials in library
  templatesCreated: number;      // Number of job templates
  clientsManaged: number;        // Number of clients in CRM
}

export interface TradeSpecificMetrics {
  trade: string;
  complianceChecklist: string[];
  complianceScore: number;
  industryBenchmarks: {
    avgQuoteConversion: number;
    avgJobsPerMonth: number;
    avgResponseTime: number;
  };
  performanceVsBenchmark: {
    quoteConversion: "above" | "at" | "below";
    jobVolume: "above" | "at" | "below";
    responseTime: "above" | "at" | "below";
  };
}

export interface BusinessScoreBreakdown {
  totalScore: number;
  ratingTier: RatingTier;
  ratingLabel: string;
  components: {
    profileCompleteness: { score: number; weight: number; weighted: number };
    quoteConversion: { score: number; weight: number; weighted: number };
    jobVolume: { score: number; weight: number; weighted: number };
    responseTime: { score: number; weight: number; weighted: number };
    verification: { score: number; weight: number; weighted: number };
    platformEngagement: { score: number; weight: number; weighted: number };
    complianceReadiness: { score: number; weight: number; weighted: number };
  };
  profileCompleteness: ProfileCompletenessBreakdown;
  quotePerformance: QuotePerformanceMetrics;
  jobPerformance: JobPerformanceMetrics;
  engagement: EngagementMetrics;
  tradeSpecific: TradeSpecificMetrics | null;
  recommendations: string[];
  lastCalculated: string;
}

// Industry benchmarks by trade
const TRADE_BENCHMARKS: Record<string, { avgQuoteConversion: number; avgJobsPerMonth: number; avgResponseTime: number }> = {
  Painter: { avgQuoteConversion: 35, avgJobsPerMonth: 8, avgResponseTime: 2 },
  Plasterer: { avgQuoteConversion: 40, avgJobsPerMonth: 6, avgResponseTime: 2 },
  Electrician: { avgQuoteConversion: 45, avgJobsPerMonth: 12, avgResponseTime: 1 },
  Plumber: { avgQuoteConversion: 50, avgJobsPerMonth: 15, avgResponseTime: 1 },
  Carpenter: { avgQuoteConversion: 38, avgJobsPerMonth: 7, avgResponseTime: 2 },
  Roofer: { avgQuoteConversion: 42, avgJobsPerMonth: 5, avgResponseTime: 3 },
  Tiler: { avgQuoteConversion: 40, avgJobsPerMonth: 6, avgResponseTime: 2 },
  Concreter: { avgQuoteConversion: 45, avgJobsPerMonth: 4, avgResponseTime: 3 },
  HVAC: { avgQuoteConversion: 48, avgJobsPerMonth: 10, avgResponseTime: 1 },
  Flooring: { avgQuoteConversion: 42, avgJobsPerMonth: 8, avgResponseTime: 2 },
  Landscaper: { avgQuoteConversion: 35, avgJobsPerMonth: 5, avgResponseTime: 3 },
  Other: { avgQuoteConversion: 40, avgJobsPerMonth: 6, avgResponseTime: 2 },
};

/**
 * Get the rating tier based on score
 */
export function getRatingTier(score: number): RatingTier {
  if (score >= RATING_TIERS.PLATINUM.min) return "PLATINUM";
  if (score >= RATING_TIERS.GOLD.min) return "GOLD";
  if (score >= RATING_TIERS.SILVER.min) return "SILVER";
  if (score >= RATING_TIERS.BRONZE.min) return "BRONZE";
  return "STARTER";
}

/**
 * Calculate profile completeness score
 */
async function calculateProfileCompleteness(userId: string): Promise<ProfileCompletenessBreakdown> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      abn: true,
      primaryTrade: true,
      businessAddressLine1: true,
      businessSuburb: true,
      businessState: true,
      businessPostcode: true,
      businessPhone: true,
      hourlyRate: true,
      dayRate: true,
      serviceArea: true,
      servicePostcodes: true,
      signatureImage: true,
    },
  });

  if (!user) {
    return {
      businessName: false,
      abn: false,
      primaryTrade: false,
      businessAddress: false,
      contactInfo: false,
      rates: false,
      serviceArea: false,
      signature: false,
      percentage: 0,
    };
  }

  const breakdown = {
    businessName: !!user.businessName,
    abn: !!user.abn,
    primaryTrade: !!user.primaryTrade,
    businessAddress: !!(user.businessAddressLine1 && user.businessSuburb && user.businessState && user.businessPostcode),
    contactInfo: !!user.businessPhone,
    rates: !!(user.hourlyRate || user.dayRate),
    serviceArea: !!(user.serviceArea || user.servicePostcodes),
    signature: !!user.signatureImage,
    percentage: 0,
  };

  // Calculate percentage
  const completed = Object.values(breakdown).filter(v => v === true).length - 1; // -1 for percentage field
  breakdown.percentage = Math.round((completed / 8) * 100);

  return breakdown;
}

/**
 * Calculate quote performance metrics
 */
async function calculateQuotePerformance(jobs: Job[]): Promise<QuotePerformanceMetrics> {
  const quoteJobs = jobs.filter(j => j.clientStatus && j.clientStatus !== "draft");
  
  const accepted = quoteJobs.filter(j => j.clientStatus === "accepted" || j.clientAcceptedAt).length;
  const declined = quoteJobs.filter(j => j.clientStatus === "declined" || j.clientDeclinedAt).length;
  const pending = quoteJobs.filter(j => j.clientStatus === "sent").length;
  const total = quoteJobs.length;
  
  // Calculate average response time (days between sent and decision)
  let totalResponseDays = 0;
  let responsesCount = 0;
  
  for (const job of quoteJobs) {
    if ((job.clientAcceptedAt || job.clientDeclinedAt) && job.updatedAt) {
      const sentDate = new Date(job.updatedAt);
      const responseDate = new Date(job.clientAcceptedAt || job.clientDeclinedAt || job.updatedAt);
      const days = Math.max(0, Math.ceil((responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)));
      totalResponseDays += days;
      responsesCount++;
    }
  }
  
  return {
    totalQuotes: total,
    acceptedQuotes: accepted,
    declinedQuotes: declined,
    pendingQuotes: pending,
    conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    avgResponseDays: responsesCount > 0 ? Math.round(totalResponseDays / responsesCount) : 0,
  };
}

/**
 * Calculate job performance metrics
 */
function calculateJobPerformance(jobs: Job[]): JobPerformanceMetrics {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const completed = jobs.filter(j => j.status === "ai_complete").length;
  const jobsLast30 = jobs.filter(j => new Date(j.createdAt) >= thirtyDaysAgo).length;
  const jobsLast90 = jobs.filter(j => new Date(j.createdAt) >= ninetyDaysAgo).length;
  
  const jobsWithVariations = jobs.filter(j => j.variationCount && j.variationCount > 0).length;
  const totalVariationValue = jobs.reduce((sum, j) => sum + (j.variationCostImpact || 0), 0);
  const variationCount = jobs.reduce((sum, j) => sum + (j.variationCount || 0), 0);
  
  return {
    totalJobs: jobs.length,
    completedJobs: completed,
    jobsLast30Days: jobsLast30,
    jobsLast90Days: jobsLast90,
    variationRate: jobs.length > 0 ? Math.round((jobsWithVariations / jobs.length) * 100) : 0,
    avgVariationValue: variationCount > 0 ? Math.round(totalVariationValue / variationCount) : 0,
  };
}

/**
 * Calculate engagement metrics
 */
async function calculateEngagementMetrics(userId: string): Promise<EngagementMetrics> {
  const prisma = getPrisma();
  
  // Get user activity data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastLoginAt: true,
      lastActivityAt: true,
    },
  });
  
  // Count materials
  const materialsCount = await prisma.materialItem.count({
    where: { userId, isArchived: false },
  });
  
  // Count templates
  const templatesCount = await prisma.jobTemplate.count({
    where: { userId },
  });
  
  // Count clients
  const clientsCount = await prisma.client.count({
    where: { ownerId: userId },
  });
  
  // Count documents (drafts)
  const docsCount = await prisma.documentDraft.count({
    where: {
      // We don't have userId on DocumentDraft, so we'll estimate from jobs
    },
  });
  
  // Estimate login frequency based on last activity
  let loginFrequency = 0;
  if (user?.lastActivityAt) {
    const daysSinceActivity = Math.ceil((Date.now() - new Date(user.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
    loginFrequency = Math.max(0, 30 - daysSinceActivity);
  }
  
  return {
    loginFrequency,
    documentsGenerated: docsCount,
    materialsLibrarySize: materialsCount,
    templatesCreated: templatesCount,
    clientsManaged: clientsCount,
  };
}

/**
 * Calculate trade-specific metrics
 */
function calculateTradeSpecificMetrics(
  primaryTrade: string | null,
  quotePerformance: QuotePerformanceMetrics,
  jobPerformance: JobPerformanceMetrics
): TradeSpecificMetrics | null {
  if (!primaryTrade) return null;
  
  const trade = primaryTrade;
  const benchmarks = TRADE_BENCHMARKS[trade] || TRADE_BENCHMARKS.Other;
  const compliance = getTradeComplianceNotes(trade);
  
  // Calculate jobs per month (last 90 days / 3)
  const jobsPerMonth = Math.round(jobPerformance.jobsLast90Days / 3);
  
  // Compare to benchmarks
  const quoteVsBenchmark = quotePerformance.conversionRate >= benchmarks.avgQuoteConversion * 1.1 ? "above" :
                          quotePerformance.conversionRate >= benchmarks.avgQuoteConversion * 0.9 ? "at" : "below";
  
  const volumeVsBenchmark = jobsPerMonth >= benchmarks.avgJobsPerMonth * 1.1 ? "above" :
                           jobsPerMonth >= benchmarks.avgJobsPerMonth * 0.9 ? "at" : "below";
  
  const responseVsBenchmark = quotePerformance.avgResponseDays <= benchmarks.avgResponseTime * 0.9 ? "above" :
                             quotePerformance.avgResponseDays <= benchmarks.avgResponseTime * 1.1 ? "at" : "below";
  
  // Compliance score based on having trade-specific compliance notes
  const complianceScore = compliance.length > 0 ? 80 : 50;
  
  return {
    trade,
    complianceChecklist: compliance,
    complianceScore,
    industryBenchmarks: benchmarks,
    performanceVsBenchmark: {
      quoteConversion: quoteVsBenchmark,
      jobVolume: volumeVsBenchmark,
      responseTime: responseVsBenchmark,
    },
  };
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(
  profileCompleteness: ProfileCompletenessBreakdown,
  quotePerformance: QuotePerformanceMetrics,
  jobPerformance: JobPerformanceMetrics,
  engagement: EngagementMetrics,
  verificationStatus: string | null
): string[] {
  const recommendations: string[] = [];
  
  // Profile recommendations
  if (!profileCompleteness.businessName) {
    recommendations.push("Add your business name to build credibility with clients");
  }
  if (!profileCompleteness.abn) {
    recommendations.push("Add your ABN to enable professional invoicing");
  }
  if (!profileCompleteness.signature) {
    recommendations.push("Upload your signature for faster document signing");
  }
  if (!profileCompleteness.rates) {
    recommendations.push("Set up your rates for accurate quoting");
  }
  
  // Quote performance recommendations
  if (quotePerformance.conversionRate < 30 && quotePerformance.totalQuotes >= 5) {
    recommendations.push("Your quote acceptance rate is below average - consider reviewing your pricing strategy");
  }
  if (quotePerformance.pendingQuotes > 5) {
    recommendations.push("You have quotes awaiting decision - follow up with clients to improve conversion");
  }
  
  // Job performance recommendations
  if (jobPerformance.jobsLast30Days === 0) {
    recommendations.push("Create new jobs regularly to maintain an active profile");
  }
  if (jobPerformance.variationRate > 40) {
    recommendations.push("High variation rate - consider more detailed initial scoping");
  }
  
  // Engagement recommendations
  if (engagement.materialsLibrarySize === 0) {
    recommendations.push("Add materials to your library for faster quoting");
  }
  if (engagement.templatesCreated === 0) {
    recommendations.push("Create job templates to save time on recurring work types");
  }
  if (engagement.clientsManaged === 0) {
    recommendations.push("Add clients to your CRM for better relationship management");
  }
  
  // Verification recommendations
  if (verificationStatus !== "verified") {
    recommendations.push("Complete business verification to boost your credibility score");
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Calculate the complete business score for a user
 */
export async function calculateBusinessScore(userId: string): Promise<BusinessScoreBreakdown> {
  const prisma = getPrisma();
  
  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      primaryTrade: true,
      verificationStatus: true,
      emailVerifiedAt: true,
    },
  });
  
  // Get all jobs for the user
  const jobs = await getJobsForUser(userId, false);
  
  // Calculate all metrics
  const profileCompleteness = await calculateProfileCompleteness(userId);
  const quotePerformance = await calculateQuotePerformance(jobs);
  const jobPerformance = calculateJobPerformance(jobs);
  const engagement = await calculateEngagementMetrics(userId);
  const tradeSpecific = calculateTradeSpecificMetrics(user?.primaryTrade || null, quotePerformance, jobPerformance);
  
  // Calculate component scores (0-100)
  const profileScore = profileCompleteness.percentage;
  
  // Quote conversion score (normalize to 0-100, where 50% conversion = 100 score)
  const quoteScore = Math.min(100, Math.round((quotePerformance.conversionRate / 50) * 100));
  
  // Job volume score (based on activity level)
  const jobScore = Math.min(100, Math.round((jobPerformance.jobsLast30Days / 10) * 100));
  
  // Response time score (faster = better, 1 day = 100, 7+ days = 0)
  const responseScore = quotePerformance.avgResponseDays > 0 
    ? Math.max(0, Math.round(100 - ((quotePerformance.avgResponseDays - 1) * 15)))
    : 70; // Default score if no responses yet
  
  // Verification score
  let verificationScore = 30; // Base score
  if (user?.emailVerifiedAt) verificationScore += 20;
  if (user?.verificationStatus === "verified") verificationScore += 50;
  else if (user?.verificationStatus === "pending") verificationScore += 20;
  
  // Engagement score
  const engagementScore = Math.min(100, 
    (engagement.loginFrequency * 2) + 
    (engagement.materialsLibrarySize > 0 ? 15 : 0) +
    (engagement.templatesCreated > 0 ? 15 : 0) +
    (engagement.clientsManaged > 0 ? 20 : 0)
  );
  
  // Compliance score
  const complianceScore = tradeSpecific?.complianceScore || 50;
  
  // Calculate weighted scores
  const components = {
    profileCompleteness: { score: profileScore, weight: SCORE_WEIGHTS.profileCompleteness, weighted: profileScore * SCORE_WEIGHTS.profileCompleteness },
    quoteConversion: { score: quoteScore, weight: SCORE_WEIGHTS.quoteConversion, weighted: quoteScore * SCORE_WEIGHTS.quoteConversion },
    jobVolume: { score: jobScore, weight: SCORE_WEIGHTS.jobVolume, weighted: jobScore * SCORE_WEIGHTS.jobVolume },
    responseTime: { score: responseScore, weight: SCORE_WEIGHTS.responseTime, weighted: responseScore * SCORE_WEIGHTS.responseTime },
    verification: { score: verificationScore, weight: SCORE_WEIGHTS.verification, weighted: verificationScore * SCORE_WEIGHTS.verification },
    platformEngagement: { score: engagementScore, weight: SCORE_WEIGHTS.platformEngagement, weighted: engagementScore * SCORE_WEIGHTS.platformEngagement },
    complianceReadiness: { score: complianceScore, weight: SCORE_WEIGHTS.complianceReadiness, weighted: complianceScore * SCORE_WEIGHTS.complianceReadiness },
  };
  
  // Calculate total score
  const totalScore = Math.round(
    components.profileCompleteness.weighted +
    components.quoteConversion.weighted +
    components.jobVolume.weighted +
    components.responseTime.weighted +
    components.verification.weighted +
    components.platformEngagement.weighted +
    components.complianceReadiness.weighted
  );
  
  // Get rating tier
  const ratingTier = getRatingTier(totalScore);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    profileCompleteness,
    quotePerformance,
    jobPerformance,
    engagement,
    user?.verificationStatus || null
  );
  
  return {
    totalScore,
    ratingTier,
    ratingLabel: RATING_TIERS[ratingTier].label,
    components,
    profileCompleteness,
    quotePerformance,
    jobPerformance,
    engagement,
    tradeSpecific,
    recommendations,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Get public rating display info
 */
export function getPublicRatingInfo(score: number): {
  tier: RatingTier;
  label: string;
  color: string;
  textColor: string;
  stars: number;
} {
  const tier = getRatingTier(score);
  const tierInfo = RATING_TIERS[tier];
  
  // Convert score to stars (1-5)
  const stars = score >= 90 ? 5 : 
                score >= 75 ? 4 : 
                score >= 60 ? 3 : 
                score >= 40 ? 2 : 1;
  
  return {
    tier,
    label: tierInfo.label,
    color: tierInfo.color,
    textColor: tierInfo.textColor,
    stars,
  };
}
