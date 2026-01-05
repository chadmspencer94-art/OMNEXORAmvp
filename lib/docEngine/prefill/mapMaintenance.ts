/**
 * Maintenance & Care Guide Prefill Mapper
 * 
 * Maps job data to Maintenance document fields:
 * - Prefills materials/finishes from materials list if available
 * - Otherwise uses placeholders
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

export interface MaintenancePrefillData extends CommonPrefillData {
  materialsUsed?: string;
  finishes?: string;
  generalCare?: string;
  specificInstructions?: string;
  recoatInterval?: string;
  warrantyInfo?: string;
}

/**
 * Parse materials from job data
 */
function parseMaterials(job: JobData): string {
  if (job.materialsOverrideText) {
    return job.materialsOverrideText;
  }
  
  if (job.aiMaterials) {
    try {
      const materials = typeof job.aiMaterials === "string" 
        ? JSON.parse(job.aiMaterials) 
        : job.aiMaterials;
      
      if (Array.isArray(materials)) {
        return materials.map((m: any) => m.item || m.name || m).join(", ");
      }
      
      return String(materials);
    } catch {
      return job.aiMaterials;
    }
  }
  
  return "";
}

/**
 * Map job data to Maintenance document fields
 */
export function mapMaintenance(
  job: JobData,
  commonData: CommonPrefillData
): MaintenancePrefillData {
  const materialsUsed = parseMaterials(job);
  
  return {
    ...commonData,
    materialsUsed,
    finishes: "", // User can fill based on materials
    generalCare: "", // User must provide
    specificInstructions: "", // User must provide
    recoatInterval: "5-7 years (interior)", // Default guidance
    warrantyInfo: "", // User can customize
  };
}

