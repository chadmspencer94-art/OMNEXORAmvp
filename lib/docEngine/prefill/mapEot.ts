/**
 * Extension of Time (EOT) Prefill Mapper
 * 
 * Maps job data to EOT document fields:
 * - Auto-generates EOT number (EOT-001, EOT-002...)
 * - Prefills job completion target if exists
 * - Leaves cause/days requested blank (required user input)
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

export interface EotPrefillData extends CommonPrefillData {
  eotNumber?: string;
  contractReference?: string;
  originalCompletionDate?: string; // ISO date string
  delayCause?: string; // Required, left blank for user to fill
  daysRequested?: number | null; // Required
  supportingInfo?: string;
}

/**
 * Generate next EOT number for a job
 * Format: EOT-001, EOT-002, etc.
 */
function generateEotNumber(jobId: string, existingCount: number = 0): string {
  const num = (existingCount + 1).toString().padStart(3, "0");
  return `EOT-${num}`;
}

/**
 * Estimate completion date from job creation date
 * Default: 14 days from creation (rough estimate)
 */
function estimateCompletionDate(job: JobData): string | null {
  if (!job.createdAt) return null;
  
  try {
    const created = new Date(job.createdAt);
    const estimated = new Date(created);
    estimated.setDate(estimated.getDate() + 14); // 2 weeks default
    return estimated.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

/**
 * Map job data to EOT document fields
 */
export function mapEot(
  job: JobData,
  commonData: CommonPrefillData,
  existingEotCount: number = 0
): EotPrefillData {
  return {
    ...commonData,
    eotNumber: generateEotNumber(job.jobId || job.id || "", existingEotCount),
    contractReference: job.jobId || job.id || "",
    originalCompletionDate: estimateCompletionDate(job),
    delayCause: "", // Required, user must fill
    daysRequested: null, // Required
    supportingInfo: "",
  };
}

