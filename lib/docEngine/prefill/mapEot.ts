/**
 * Extension of Time (EOT) Prefill Mapper
 * 
 * R8: Maps job data to EOT document fields with client-ready baseline:
 * - EOT Ref/ID (auto-generated)
 * - Date
 * - Cause/Reason (required user input)
 * - Original completion date
 * - Revised completion date
 * - Time impact
 * - Evidence/attachments reference
 * - Status (Draft/Pending/Approved/Rejected)
 * - Acknowledgement/approval section (client + contractor)
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

/**
 * R8: EOT status options
 */
export type EotStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface EotPrefillData extends CommonPrefillData {
  // R8: Required baseline fields
  eotNumber?: string;                 // EOT Ref/ID
  eotDate?: string;                   // Date (ISO format)
  contractReference?: string;         // Original job/contract reference
  
  // Cause and impact
  delayCause?: string;                // Cause/Reason (required user input)
  delayCircumstances?: string;        // Detailed circumstances
  
  // Dates
  originalCompletionDate?: string;    // Original completion date (ISO)
  originalCompletionDisplay?: string; // Formatted for display
  revisedCompletionDate?: string;     // Revised completion date (ISO)
  revisedCompletionDisplay?: string;  // Formatted for display
  
  // Time impact
  daysRequested?: number | string | null;     // Time impact in days (number or "TBC")
  timeImpactDisplay?: string;         // Formatted time impact for display
  
  // Evidence/attachments
  evidenceReference?: string;         // Reference to attached evidence
  attachmentCount?: number;           // Number of attachments
  attachmentList?: string;            // List of attachment filenames
  
  // Status
  status?: EotStatus;                 // Current status
  statusDisplay?: string;             // Formatted status for display
  
  // Supporting info (legacy)
  supportingInfo?: string;
  
  // Approval tracking
  contractorAcknowledgedAt?: string | null;
  contractorAcknowledgedBy?: string | null;
  clientAcknowledgedAt?: string | null;
  clientAcknowledgedBy?: string | null;
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
 * R8: Format date for display (Australian format)
 */
function formatDateDisplay(isoDate: string | null | undefined): string {
  if (!isoDate) return "Not provided";
  try {
    return new Date(isoDate).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * R8: Format status for display
 */
function formatEotStatus(status: EotStatus): string {
  const statusMap: Record<EotStatus, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return statusMap[status] || "Draft";
}

/**
 * R8: Format time impact for display
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
  return `${days} day${days !== 1 ? "s" : ""}`;
}

/**
 * R8: Map job data to EOT document fields with client-ready baseline
 */
export function mapEot(
  job: JobData,
  commonData: CommonPrefillData,
  existingEotCount: number = 0,
  attachments?: { filename: string }[]
): EotPrefillData {
  const originalCompletion = estimateCompletionDate(job);
  
  // Default status for new EOTs
  const status: EotStatus = "DRAFT";
  
  // Build attachment info
  const attachmentCount = attachments?.length || 0;
  const attachmentList = attachments && attachments.length > 0
    ? attachments.map(a => a.filename).join(", ")
    : "None attached";
  
  return {
    ...commonData,
    // R8: Required baseline fields
    eotNumber: generateEotNumber(job.jobId || job.id || "", existingEotCount),
    eotDate: new Date().toISOString(),
    contractReference: job.jobId || job.id || "",
    
    // Cause and impact (required user input)
    delayCause: "", // Required, user must fill
    delayCircumstances: "", // User provides details
    
    // Dates
    originalCompletionDate: originalCompletion ?? undefined,
    originalCompletionDisplay: formatDateDisplay(originalCompletion),
    revisedCompletionDate: undefined, // User must calculate
    revisedCompletionDisplay: "TBC",
    
    // Time impact
    daysRequested: null, // Required
    timeImpactDisplay: formatTimeImpact(null),
    
    // Evidence/attachments
    evidenceReference: attachmentCount > 0 
      ? `${attachmentCount} attachment(s) attached` 
      : "None attached",
    attachmentCount,
    attachmentList,
    
    // Status
    status,
    statusDisplay: formatEotStatus(status),
    
    // Legacy
    supportingInfo: "",
    
    // Approval tracking (blank for new EOTs)
    contractorAcknowledgedAt: null,
    contractorAcknowledgedBy: null,
    clientAcknowledgedAt: null,
    clientAcknowledgedBy: null,
  };
}

