/**
 * Variation / Change Order Prefill Mapper
 * 
 * Maps job data to Variation document fields:
 * - Auto-generates variation number (VAR-001, VAR-002...)
 * - Pulls scope/inclusions/exclusions snapshot as reference text
 * - Leaves variationDescription blank (required user input)
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

export interface VariationPrefillData extends CommonPrefillData {
  variationNumber?: string;
  contractReference?: string;
  originalScopeReference?: string;
  variationDescription?: string; // Required, left blank for user to fill
  costImpact?: number | null;
  timeImpactDays?: number | null;
}

/**
 * Generate next variation number for a job
 * Format: VAR-001, VAR-002, etc.
 * In a real system, this would query existing variations for the job.
 * For MVP, we'll use a simple incrementing approach.
 */
function generateVariationNumber(jobId: string, existingCount: number = 0): string {
  const num = (existingCount + 1).toString().padStart(3, "0");
  return `VAR-${num}`;
}

/**
 * Map job data to Variation document fields
 */
export function mapVariation(
  job: JobData,
  commonData: CommonPrefillData,
  existingVariationCount: number = 0
): VariationPrefillData {
  // Build original scope reference from job data
  const scopeParts: string[] = [];
  if (job.aiScopeOfWork) scopeParts.push(`Scope: ${job.aiScopeOfWork}`);
  if (job.aiInclusions) scopeParts.push(`Inclusions: ${job.aiInclusions}`);
  if (job.aiExclusions) scopeParts.push(`Exclusions: ${job.aiExclusions}`);
  const originalScopeReference = scopeParts.length > 0 ? scopeParts.join("\n\n") : "";
  
  return {
    ...commonData,
    variationNumber: generateVariationNumber(job.jobId || job.id || "", existingVariationCount),
    contractReference: job.jobId || job.id || "",
    originalScopeReference,
    variationDescription: "", // Required, user must fill
    costImpact: null,
    timeImpactDays: null,
  };
}

