/**
 * Pricing helper functions for computing effective rates
 * Combines user business profile rates with job-level overrides
 */

import type { SafeUser } from "./auth";
import type { Job } from "./jobs";
import { getPrisma } from "./prisma";

// ============================================================================
// Types
// ============================================================================

export interface EffectiveRates {
  hourlyRate?: number;
  helperHourlyRate?: number;
  dayRate?: number;
  ratePerM2Interior?: number;
  ratePerM2Exterior?: number;
  ratePerLmTrim?: number;
  calloutFee?: number;
  minCharge?: number;
  materialMarkupPercent?: number;
  // Business & Rates settings
  defaultMarginPct?: number | null;
  defaultDepositPct?: number | null;
  gstRegistered?: boolean;
  defaultPaymentTerms?: string | null;
  tradeRates?: {
    painter?: {
      wallsPerM2?: number;
      ceilingsPerM2?: number;
      trimPerM?: number;
      doorsEach?: number;
    };
  } | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Computes effective rates for a job by combining:
 * 1. Job-level overrides (if present)
 * 2. RateTemplate (if job has rateTemplateId)
 * 3. User business profile rates (from Prisma)
 * 4. User pricing settings (from KV)
 * 
 * Uses the rateResolver helper for consistent hierarchy.
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
  
  // Import rateResolver
  const { resolveEffectiveRates } = await import("./rateResolver");
  
  // Load business profile rates from Prisma
  let prismaUser = null;
  let rateTemplate = null;
  
  try {
    // Load business profile and Business & Rates settings
    const prisma = getPrisma();
    prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        hourlyRate: true,
        dayRate: true,
        calloutFee: true,
        ratePerM2Interior: true,
        ratePerM2Exterior: true,
        ratePerLmTrim: true,
        gstRegistered: true,
        defaultMarginPct: true,
        defaultDepositPct: true,
        defaultPaymentTerms: true,
        tradeRatesJson: true,
      },
    });

    // Load rate template if job has rateTemplateId
    if (job?.rateTemplateId) {
      rateTemplate = await (prisma as any).rateTemplate.findUnique({
        where: { id: job.rateTemplateId },
      });
    }
  } catch (error) {
    // If Prisma lookup fails, continue without template/profile
    console.warn("Failed to load Prisma data for rates:", error);
  }

  // Use rateResolver for consistent hierarchy
  const businessProfile = prismaUser ? {
    hourlyRate: prismaUser.hourlyRate,
    calloutFee: prismaUser.calloutFee,
    ratePerM2Interior: prismaUser.ratePerM2Interior,
    ratePerM2Exterior: prismaUser.ratePerM2Exterior,
    ratePerLmTrim: prismaUser.ratePerLmTrim,
  } : null;

  const resolvedRates = resolveEffectiveRates({
    job: job || ({} as Job),
    rateTemplate: rateTemplate ? {
      id: rateTemplate.id,
      userId: rateTemplate.userId,
      name: rateTemplate.name,
      tradeType: rateTemplate.tradeType,
      propertyType: rateTemplate.propertyType,
      hourlyRate: rateTemplate.hourlyRate,
      helperHourlyRate: rateTemplate.helperHourlyRate,
      dayRate: rateTemplate.dayRate,
      calloutFee: rateTemplate.calloutFee,
      minCharge: rateTemplate.minCharge,
      ratePerM2Interior: rateTemplate.ratePerM2Interior,
      ratePerM2Exterior: rateTemplate.ratePerM2Exterior,
      ratePerLmTrim: rateTemplate.ratePerLmTrim,
      materialMarkupPercent: rateTemplate.materialMarkupPercent,
      isDefault: rateTemplate.isDefault,
      createdAt: rateTemplate.createdAt,
      updatedAt: rateTemplate.updatedAt,
    } : null,
    businessProfile,
  });

  // Fallback to KV pricing settings for material markup if not in template
  if (resolvedRates.materialMarkupPercent == null && user.materialMarkupPercent != null) {
    resolvedRates.materialMarkupPercent = user.materialMarkupPercent;
  }

  // Add Business & Rates settings from Prisma
  if (prismaUser) {
    // Use defaultMarginPct from Business & Rates if materialMarkupPercent not already set
    if (resolvedRates.materialMarkupPercent == null && prismaUser.defaultMarginPct != null) {
      resolvedRates.materialMarkupPercent = Number(prismaUser.defaultMarginPct);
    }
    
    resolvedRates.defaultMarginPct = prismaUser.defaultMarginPct ? Number(prismaUser.defaultMarginPct) : null;
    resolvedRates.defaultDepositPct = prismaUser.defaultDepositPct ? Number(prismaUser.defaultDepositPct) : null;
    resolvedRates.gstRegistered = prismaUser.gstRegistered ?? false;
    resolvedRates.defaultPaymentTerms = prismaUser.defaultPaymentTerms ?? null;
    
    // Parse tradeRatesJson if present
    if (prismaUser.tradeRatesJson) {
      try {
        resolvedRates.tradeRates = JSON.parse(prismaUser.tradeRatesJson);
      } catch {
        resolvedRates.tradeRates = null;
      }
    }
    
    // Add dayRate if not already set from template
    if (resolvedRates.dayRate == null && prismaUser.dayRate != null) {
      resolvedRates.dayRate = prismaUser.dayRate;
    }
  }

  return resolvedRates;
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
    const low = baseTotal * 0.95;
    const high = baseTotal * 1.10;

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

