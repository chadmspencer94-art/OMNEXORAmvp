/**
 * Rate resolver helper that resolves effective rates for a job from:
 * 1. Job overrides
 * 2. Linked RateTemplate (if set)
 * 3. Business profile defaults
 * 
 * This ensures consistent rate hierarchy across the application.
 */

import type { Job } from "./jobs";
import type { EffectiveRates } from "./pricing";

export interface RateTemplate {
  id: string;
  userId: string;
  name: string;
  tradeType: string | null;
  propertyType: string | null;
  hourlyRate: number | null;
  helperHourlyRate: number | null;
  dayRate: number | null;
  calloutFee: number | null;
  minCharge: number | null;
  ratePerM2Interior: number | null;
  ratePerM2Exterior: number | null;
  ratePerLmTrim: number | null;
  materialMarkupPercent: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessProfile {
  hourlyRate: number | null;
  calloutFee: number | null;
  ratePerM2Interior: number | null;
  ratePerM2Exterior: number | null;
  ratePerLmTrim: number | null;
}

/**
 * Resolves effective rates for a job following the hierarchy:
 * Job overrides → RateTemplate → BusinessProfile
 */
export function resolveEffectiveRates(args: {
  job: Job & { rateTemplate?: RateTemplate | null };
  rateTemplate?: RateTemplate | null; // optional separate fetch
  businessProfile?: BusinessProfile | null; // user-level defaults
}): EffectiveRates {
  const { job, rateTemplate, businessProfile } = args;
  
  // Use rateTemplate from args if provided, otherwise from job
  const template = rateTemplate || job.rateTemplate;

  const rates: EffectiveRates = {};

  // Hourly rate: job override → template → business profile
  if (job.labourRatePerHour != null) {
    rates.hourlyRate = job.labourRatePerHour;
  } else if (template?.hourlyRate != null) {
    rates.hourlyRate = template.hourlyRate;
  } else if (businessProfile?.hourlyRate != null) {
    rates.hourlyRate = businessProfile.hourlyRate;
  }

  // Helper hourly rate: job override → template
  if (job.helperRatePerHour != null) {
    rates.helperHourlyRate = job.helperRatePerHour;
  } else if (template?.helperHourlyRate != null) {
    rates.helperHourlyRate = template.helperHourlyRate;
  }

  // Day rate: template only (no job override or business profile equivalent)
  if (template?.dayRate != null) {
    rates.dayRate = template.dayRate;
  }

  // Callout fee: template → business profile
  if (template?.calloutFee != null) {
    rates.calloutFee = template.calloutFee;
  } else if (businessProfile?.calloutFee != null) {
    rates.calloutFee = businessProfile.calloutFee;
  }

  // Minimum charge: template only
  if (template?.minCharge != null) {
    rates.minCharge = template.minCharge;
  }

  // Rate per m² interior: template → business profile
  if (template?.ratePerM2Interior != null) {
    rates.ratePerM2Interior = template.ratePerM2Interior;
  } else if (businessProfile?.ratePerM2Interior != null) {
    rates.ratePerM2Interior = businessProfile.ratePerM2Interior;
  }

  // Rate per m² exterior: template → business profile
  if (template?.ratePerM2Exterior != null) {
    rates.ratePerM2Exterior = template.ratePerM2Exterior;
  } else if (businessProfile?.ratePerM2Exterior != null) {
    rates.ratePerM2Exterior = businessProfile.ratePerM2Exterior;
  }

  // Rate per linear metre: template → business profile
  if (template?.ratePerLmTrim != null) {
    rates.ratePerLmTrim = template.ratePerLmTrim;
  } else if (businessProfile?.ratePerLmTrim != null) {
    rates.ratePerLmTrim = businessProfile.ratePerLmTrim;
  }

  // Material markup: template only (business profile doesn't have this)
  if (template?.materialMarkupPercent != null) {
    rates.materialMarkupPercent = template.materialMarkupPercent;
  }

  return rates;
}

