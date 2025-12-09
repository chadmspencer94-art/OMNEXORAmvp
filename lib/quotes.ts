/**
 * Quote number and version management helpers
 */

import { getJobById, saveJob } from "./jobs";
import { prisma } from "./prisma";

/**
 * Ensures a job has a quote number, generating one if needed.
 * Format: Q-{YYYY}-{NNNN} (e.g. Q-2024-0012)
 */
export async function ensureQuoteNumber(jobId: string): Promise<string> {
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // If quote number already exists, return it
  if (job.quoteNumber) {
    return job.quoteNumber;
  }

  // Generate a new quote number
  const currentYear = new Date().getFullYear();
  
  // For MVP, use a simple sequence based on timestamp
  // In production, you might want a per-user or global sequence counter
  const timestamp = Date.now();
  const sequence = (timestamp % 10000).toString().padStart(4, "0");
  
  const quoteNumber = `Q-${currentYear}-${sequence}`;

  // Save the quote number to the job
  job.quoteNumber = quoteNumber;
  await saveJob(job);

  return quoteNumber;
}

/**
 * Gets the next quote version number for a job.
 * Returns max(version) + 1, or 1 if none exist.
 */
export async function getNextQuoteVersion(jobId: string): Promise<number> {
  try {
    const existingVersions = await (prisma as any).jobQuoteVersion.findMany({
      where: { jobId },
      select: { version: true },
      orderBy: { version: "desc" },
      take: 1,
    });

    if (existingVersions.length === 0) {
      return 1;
    }

    const maxVersion = existingVersions[0].version;
    return maxVersion + 1;
  } catch (error) {
    console.error("Error getting next quote version:", error);
    // Fallback: return 1 if query fails
    return 1;
  }
}

