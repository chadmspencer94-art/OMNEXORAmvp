/**
 * Pricing helper functions for computing effective rates
 * Combines user business profile rates with job-level overrides
 */

import type { SafeUser } from "./auth";
import type { Job } from "./jobs";
import { prisma } from "./prisma";

// ============================================================================
// Types
// ============================================================================

export interface EffectiveRates {
  hourlyRate?: number;
  helperHourlyRate?: number;
  ratePerM2Interior?: number;
  ratePerM2Exterior?: number;
  ratePerLmTrim?: number;
  calloutFee?: number;
  materialMarkupPercent?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Computes effective rates for a job by combining:
 * 1. Job-level overrides (if present)
 * 2. User business profile rates (from Prisma)
 * 3. User pricing settings (from KV)
 * 
 * Job overrides take precedence, then business profile, then pricing settings.
 * 
 * @param user - The user object from KV (SafeUser)
 * @param job - The job object (optional, for job-level overrides)
 * @returns Effective rates to use for quote generation
 */
export async function getEffectiveRates(args: {
  user: SafeUser;
  job?: Job | null;
}): Promise<EffectiveRates> {
  const { user, job } = args;
  
  // Load business profile rates from Prisma
  let prismaUser = null;
  try {
    prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        hourlyRate: true,
        calloutFee: true,
        ratePerM2Interior: true,
        ratePerM2Exterior: true,
        ratePerLmTrim: true,
      },
    });
  } catch (error) {
    // If Prisma lookup fails, continue with KV-only data
    console.warn("Failed to load Prisma user for rates:", error);
  }

  // Build effective rates: job override > Prisma business profile > KV pricing settings
  const rates: EffectiveRates = {};

  // Hourly rate: job override > Prisma hourlyRate > KV hourlyRate
  if (job?.labourRatePerHour !== null && job?.labourRatePerHour !== undefined) {
    rates.hourlyRate = job.labourRatePerHour;
  } else if (prismaUser?.hourlyRate !== null && prismaUser?.hourlyRate !== undefined) {
    rates.hourlyRate = prismaUser.hourlyRate;
  } else if (user.hourlyRate !== null && user.hourlyRate !== undefined) {
    rates.hourlyRate = user.hourlyRate;
  }

  // Helper hourly rate: job override only (no business profile equivalent)
  if (job?.helperRatePerHour !== null && job?.helperRatePerHour !== undefined) {
    rates.helperHourlyRate = job.helperRatePerHour;
  }

  // Rate per m² interior: Prisma only
  if (prismaUser?.ratePerM2Interior !== null && prismaUser?.ratePerM2Interior !== undefined) {
    rates.ratePerM2Interior = prismaUser.ratePerM2Interior;
  }

  // Rate per m² exterior: Prisma only
  if (prismaUser?.ratePerM2Exterior !== null && prismaUser?.ratePerM2Exterior !== undefined) {
    rates.ratePerM2Exterior = prismaUser.ratePerM2Exterior;
  }

  // Rate per linear metre: Prisma only
  if (prismaUser?.ratePerLmTrim !== null && prismaUser?.ratePerLmTrim !== undefined) {
    rates.ratePerLmTrim = prismaUser.ratePerLmTrim;
  }

  // Callout fee: Prisma only
  if (prismaUser?.calloutFee !== null && prismaUser?.calloutFee !== undefined) {
    rates.calloutFee = prismaUser.calloutFee;
  }

  // Material markup: KV only (no Prisma equivalent yet)
  if (user.materialMarkupPercent !== null && user.materialMarkupPercent !== undefined) {
    rates.materialMarkupPercent = user.materialMarkupPercent;
  }

  return rates;
}

/**
 * Formats effective rates for display in UI
 * Shows which rates are being used and their source
 */
export function formatEffectiveRatesForDisplay(rates: EffectiveRates): string {
  const parts: string[] = [];
  
  if (rates.hourlyRate) {
    parts.push(`$${rates.hourlyRate}/hr`);
  }
  if (rates.ratePerM2Interior) {
    parts.push(`$${rates.ratePerM2Interior}/m² interior`);
  }
  if (rates.ratePerM2Exterior) {
    parts.push(`$${rates.ratePerM2Exterior}/m² exterior`);
  }
  if (rates.ratePerLmTrim) {
    parts.push(`$${rates.ratePerLmTrim}/lm`);
  }
  if (rates.calloutFee) {
    parts.push(`$${rates.calloutFee} callout`);
  }

  return parts.length > 0 ? parts.join(", ") : "default rates";
}

/**
 * Extracts numeric value from a currency string (e.g., "$1,385.50" -> 1385.50)
 */
function extractNumericValue(currencyString: string): number | null {
  // Remove currency symbols, commas, and spaces, then parse
  const cleaned = currencyString.replace(/[$,£€¥\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats a number as currency with commas (e.g., 1385.5 -> "$1,386")
 */
function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("en-AU")}`;
}

/**
 * Calculates a realistic estimate range from a quote
 * 
 * Takes the total estimate from a quote and derives a range:
 * - Low: 5% below base (rounded to nearest $10)
 * - High: 10% above base (rounded to nearest $10)
 * 
 * @param quoteJson - The JSON string containing the quote
 * @returns Object with baseTotal, lowEstimate, highEstimate, and formattedRange
 */
export interface EstimateRange {
  baseTotal: number | null;
  lowEstimate: number | null;
  highEstimate: number | null;
  formattedRange: string;
}

export function calculateEstimateRange(quoteJson: string | undefined | null): EstimateRange {
  if (!quoteJson) {
    return {
      baseTotal: null,
      lowEstimate: null,
      highEstimate: null,
      formattedRange: "N/A",
    };
  }

  try {
    const quote = JSON.parse(quoteJson);
    const totalEstimateText = quote.totalEstimate?.totalJobEstimate;

    if (!totalEstimateText || typeof totalEstimateText !== "string") {
      return {
        baseTotal: null,
        lowEstimate: null,
        highEstimate: null,
        formattedRange: "N/A",
      };
    }

    // Try to extract numeric value from the total estimate string
    // Handle formats like "$1,385.50", "$1,385.50 – $1,385.50", "$1,350 - $1,550", etc.
    const rangeMatch = totalEstimateText.match(/\$[\d,]+\.?\d*/g);
    let baseTotal: number | null = null;

    if (rangeMatch && rangeMatch.length > 0) {
      // If there's a range, use the first value as base
      // If identical min/max, use that value
      const firstValue = extractNumericValue(rangeMatch[0]);
      const secondValue = rangeMatch[1] ? extractNumericValue(rangeMatch[1]) : null;
      
      if (firstValue !== null) {
        // If both values exist and are different, use the average
        if (secondValue !== null && Math.abs(firstValue - secondValue) > 1) {
          baseTotal = (firstValue + secondValue) / 2;
        } else {
          // Use the first value as base
          baseTotal = firstValue;
        }
      }
    } else {
      // Try to extract any number from the string
      baseTotal = extractNumericValue(totalEstimateText);
    }

    // Fallback: try to calculate from labour + materials if available
    if (baseTotal === null) {
      let labourTotal = 0;
      let materialsTotal = 0;

      if (quote.labour?.total) {
        const labourValue = extractNumericValue(quote.labour.total);
        if (labourValue !== null) labourTotal = labourValue;
      }

      if (quote.materials?.totalMaterialsCost) {
        const materialsValue = extractNumericValue(quote.materials.totalMaterialsCost);
        if (materialsValue !== null) materialsTotal = materialsValue;
      }

      if (labourTotal > 0 || materialsTotal > 0) {
        baseTotal = labourTotal + materialsTotal;
      }
    }

    if (baseTotal === null || baseTotal <= 0) {
      return {
        baseTotal: null,
        lowEstimate: null,
        highEstimate: null,
        formattedRange: "N/A",
      };
    }

    // Calculate range: 5% below, 10% above
    let low = baseTotal * 0.95;
    let high = baseTotal * 1.10;

    // Round to nearest $10
    const lowRounded = Math.round(low / 10) * 10;
    const highRounded = Math.round(high / 10) * 10;

    // Ensure low < high
    if (lowRounded >= highRounded) {
      // Fallback: use base ± $50
      return {
        baseTotal,
        lowEstimate: Math.max(0, Math.round(baseTotal - 50)),
        highEstimate: Math.round(baseTotal + 50),
        formattedRange: `${formatCurrency(Math.max(0, Math.round(baseTotal - 50)))} – ${formatCurrency(Math.round(baseTotal + 50))}`,
      };
    }

    return {
      baseTotal,
      lowEstimate: lowRounded,
      highEstimate: highRounded,
      formattedRange: `${formatCurrency(lowRounded)} – ${formatCurrency(highRounded)}`,
    };
  } catch (error) {
    console.error("Error calculating estimate range:", error);
    return {
      baseTotal: null,
      lowEstimate: null,
      highEstimate: null,
      formattedRange: "N/A",
    };
  }
}

