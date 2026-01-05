/**
 * Handover & Practical Completion Prefill Mapper
 * 
 * Maps job data to Handover document fields:
 * - Prefills completion date: today
 * - Prefills summary of works from scope
 * - Default defects: "None" but editable
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

export interface HandoverPrefillData extends CommonPrefillData {
  completionDate?: string; // ISO date string, defaults to today
  summaryOfWorks?: string;
  defects?: string; // Default: "None"
  documentsHandedOver?: string;
  keysReturned?: boolean;
  manualsProvided?: boolean;
}

/**
 * Map job data to Handover document fields
 */
export function mapHandover(
  job: JobData,
  commonData: CommonPrefillData
): HandoverPrefillData {
  const today = new Date().toISOString().split("T")[0];
  
  // Build summary of works from scope
  const summaryParts: string[] = [];
  if (job.aiScopeOfWork) summaryParts.push(job.aiScopeOfWork);
  if (job.aiSummary) summaryParts.push(job.aiSummary);
  const summaryOfWorks = summaryParts.length > 0 
    ? summaryParts.join("\n\n") 
    : job.notes || "";
  
  return {
    ...commonData,
    completionDate: today,
    summaryOfWorks,
    defects: "None", // Default, but editable
    documentsHandedOver: "",
    keysReturned: false,
    manualsProvided: false,
  };
}

