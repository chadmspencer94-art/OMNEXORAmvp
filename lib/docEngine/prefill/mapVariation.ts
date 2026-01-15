/**
 * Variation / Change Order Prefill Mapper
 * 
 * R7: Maps job data to Variation document fields with client-ready baseline:
 * - Variation Ref/ID (auto-generated)
 * - Date
 * - Description (required user input)
 * - Reason (required user input)
 * - Cost impact (number or "TBC")
 * - Time impact (number/units or "TBC")
 * - Status: Draft / Pending approval / Approved / Rejected
 * - Approval section: Client and Contractor signature lines
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

/**
 * R7: Variation status options
 */
export type VariationStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface VariationPrefillData extends CommonPrefillData {
  // R7: Required baseline fields
  variationNumber?: string;           // Variation Ref/ID
  variationDate?: string;             // Date (ISO format)
  contractReference?: string;         // Original job/contract reference
  originalScopeReference?: string;    // Reference to original scope
  variationDescription?: string;      // Description (required user input)
  variationReason?: string;           // Reason for variation (required user input)
  costImpact?: number | string | null;        // Cost impact (number or "TBC")
  costImpactDisplay?: string;         // Formatted cost impact for display
  timeImpactDays?: number | string | null;    // Time impact in days (number or "TBC")
  timeImpactDisplay?: string;         // Formatted time impact for display
  status?: VariationStatus;           // Current status
  statusDisplay?: string;             // Formatted status for display
  // Approval tracking
  contractorApprovedAt?: string | null;
  contractorApprovedBy?: string | null;
  clientApprovedAt?: string | null;
  clientApprovedBy?: string | null;
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
 * R7: Format status for display
 */
function formatVariationStatus(status: VariationStatus): string {
  const statusMap: Record<VariationStatus, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return statusMap[status] || "Draft";
}

/**
 * R7: Format cost impact for display
 * Returns "TBC" if not set, formatted currency if number
 */
function formatCostImpact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "TBC";
  }
  if (typeof value === "string") {
    return value; // Already formatted or "TBC"
  }
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * R7: Format time impact for display
 * Returns "TBC" if not set, formatted days if number
 */
function formatTimeImpact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "TBC";
  }
  if (typeof value === "string") {
    return value; // Already formatted or "TBC"
  }
  const days = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${days} day${days !== 1 ? "s" : ""}`;
}

/**
 * R7: Map job data to Variation document fields with client-ready baseline
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
  
  // Default status for new variations
  const status: VariationStatus = "DRAFT";
  
  return {
    ...commonData,
    // R7: Required baseline fields
    variationNumber: generateVariationNumber(job.jobId || job.id || "", existingVariationCount),
    variationDate: new Date().toISOString(),
    contractReference: job.jobId || job.id || "",
    originalScopeReference,
    variationDescription: "", // Required, user must fill
    variationReason: "", // Required, user must fill
    costImpact: null,
    costImpactDisplay: formatCostImpact(null),
    timeImpactDays: null,
    timeImpactDisplay: formatTimeImpact(null),
    status,
    statusDisplay: formatVariationStatus(status),
    // Approval tracking (blank for new variations)
    contractorApprovedAt: null,
    contractorApprovedBy: null,
    clientApprovedAt: null,
    clientApprovedBy: null,
  };
}

