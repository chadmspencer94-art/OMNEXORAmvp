/**
 * Service Area Matching helper functions
 * Determines if a job matches a user's service area and work types
 */

import type { Job } from "./jobs";
import { prisma } from "./prisma";

// ============================================================================
// Types
// ============================================================================

export type MatchReason = {
  reason: string;
};

export type MatchResult = {
  matches: boolean;
  reasons: MatchReason[];
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes a string for matching (lowercase, trim, remove extra spaces)
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Extracts tokens from a comma/whitespace-separated string
 * Returns an array of normalized tokens
 */
function extractTokens(str: string | null | undefined): string[] {
  if (!str) return [];
  
  return str
    .split(/[,\n\r]+/)
    .map((token) => normalizeString(token))
    .filter((token) => token.length > 0);
}

/**
 * Extracts suburb and postcode from a job address
 * Returns an array of normalized location tokens
 */
function extractLocationFromAddress(address: string | null | undefined): string[] {
  if (!address) return [];
  
  const normalized = normalizeString(address);
  const tokens: string[] = [];
  
  // Extract postcode (4-digit number, typically at the end)
  const postcodeMatch = normalized.match(/\b(\d{4})\b/);
  if (postcodeMatch) {
    tokens.push(postcodeMatch[1]);
  }
  
  // Extract suburb (word before "WA" or before postcode, or common suburb patterns)
  // Common patterns: "Suburb WA 1234", "Suburb, WA", "123 Main St, Suburb"
  const suburbPatterns = [
    /([a-z]+(?:\s+[a-z]+)*)\s+wa\s+\d{4}/i,  // "Baldivis WA 6171"
    /([a-z]+(?:\s+[a-z]+)*),\s*wa/i,         // "Baldivis, WA"
    /,\s*([a-z]+(?:\s+[a-z]+)*)\s+wa/i,      // ", Baldivis WA"
    /,\s*([a-z]+(?:\s+[a-z]+)*)\s+\d{4}/i,    // ", Baldivis 6171"
  ];
  
  for (const pattern of suburbPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      tokens.push(normalizeString(match[1]));
    }
  }
  
  // If no suburb found, try to extract words that might be suburbs
  // (This is a fallback - not perfect but better than nothing)
  if (tokens.length === 0 || (tokens.length === 1 && /^\d{4}$/.test(tokens[0]))) {
    const words = normalized.split(/\s+/);
    // Take the last 1-2 words before "WA" or postcode as potential suburb
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i] === "wa" || /^\d{4}$/.test(words[i])) {
        if (i > 0) {
          tokens.push(normalizeString(words[i - 1]));
        }
        break;
      }
    }
  }
  
  return [...new Set(tokens)]; // Remove duplicates
}

/**
 * Determines if a property type indicates residential, commercial, or strata
 * Returns an object with flags
 */
function parsePropertyType(propertyType: string | null | undefined): {
  isResidential: boolean;
  isCommercial: boolean;
  isStrata: boolean;
} {
  if (!propertyType) {
    return { isResidential: true, isCommercial: false, isStrata: false };
  }
  
  const normalized = normalizeString(propertyType);
  
  // Check for commercial indicators
  const commercialKeywords = ["commercial", "office", "retail", "warehouse", "factory", "shop", "business"];
  const isCommercial = commercialKeywords.some((keyword) => normalized.includes(keyword));
  
  // Check for strata indicators
  const strataKeywords = ["strata", "unit", "apartment", "townhouse", "villa", "condo"];
  const isStrata = strataKeywords.some((keyword) => normalized.includes(keyword));
  
  // Default to residential if not clearly commercial or strata
  const isResidential = !isCommercial && !isStrata;
  
  return { isResidential, isCommercial, isStrata };
}

/**
 * Checks if a job's trade type matches the user's trade types
 */
function matchesTradeType(
  jobTradeType: string,
  userPrimaryTrade: string | null | undefined,
  userTradeTypes: string | null | undefined
): boolean {
  if (!userPrimaryTrade && !userTradeTypes) {
    return false; // User hasn't set any trade preferences
  }
  
  const normalizedJobTrade = normalizeString(jobTradeType);
  
  // Check primary trade
  if (userPrimaryTrade && normalizeString(userPrimaryTrade) === normalizedJobTrade) {
    return true;
  }
  
  // Check secondary trades (comma-separated)
  if (userTradeTypes) {
    const tradeTokens = extractTokens(userTradeTypes);
    return tradeTokens.some((token) => token === normalizedJobTrade);
  }
  
  return false;
}

/**
 * Determines if a job matches a user's service area and work types
 * 
 * @param user - Prisma User object (must include service area and trade fields)
 * @param job - Job object
 * @returns MatchResult with matches flag and human-readable reasons
 */
export async function doesJobMatchUser(args: {
  user: { id: string; email: string };
  job: Job;
}): Promise<MatchResult> {
  const { user, job } = args;
  
  // Load user from Prisma to get business profile fields
  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      primaryTrade: true,
      tradeTypes: true,
      doesResidential: true,
      doesCommercial: true,
      doesStrata: true,
      servicePostcodes: true,
    },
  });
  
  // If user doesn't have a Prisma record or hasn't set preferences, don't match
  if (!prismaUser || (!prismaUser.primaryTrade && !prismaUser.tradeTypes)) {
    return {
      matches: false,
      reasons: [{ reason: "User hasn't configured trade preferences" }],
    };
  }
  
  const reasons: MatchReason[] = [];
  let matches = true;
  
  // Check 1: Trade type compatibility
  const tradeMatches = matchesTradeType(
    job.tradeType,
    prismaUser.primaryTrade,
    prismaUser.tradeTypes
  );
  
  if (!tradeMatches) {
    matches = false;
    reasons.push({ reason: "Trade type does not match your specialties" });
  } else {
    reasons.push({ reason: "Matches your trade type" });
  }
  
  // Check 2: Work type compatibility (residential/commercial/strata)
  const propertyType = parsePropertyType(job.propertyType);
  
  if (propertyType.isResidential && !prismaUser.doesResidential) {
    matches = false;
    reasons.push({ reason: "Job is residential but you don't do residential work" });
  } else if (propertyType.isResidential) {
    reasons.push({ reason: "Matches residential work type" });
  }
  
  if (propertyType.isCommercial && !prismaUser.doesCommercial) {
    matches = false;
    reasons.push({ reason: "Job is commercial but you don't do commercial work" });
  } else if (propertyType.isCommercial) {
    reasons.push({ reason: "Matches commercial work type" });
  }
  
  if (propertyType.isStrata && !prismaUser.doesStrata) {
    matches = false;
    reasons.push({ reason: "Job is strata but you don't do strata work" });
  } else if (propertyType.isStrata) {
    reasons.push({ reason: "Matches strata work type" });
  }
  
  // Check 3: Service area compatibility
  const userServiceTokens = extractTokens(prismaUser.servicePostcodes);
  const jobLocationTokens = extractLocationFromAddress(job.address);
  
  if (userServiceTokens.length === 0) {
    // User hasn't set service area - allow match but note it
    reasons.push({ reason: "No service area configured (allowed by default)" });
  } else if (jobLocationTokens.length === 0) {
    // Job has no location data - allow match but note it
    reasons.push({ reason: "No location data on job (allowed by default)" });
  } else {
    // Check if any user service token matches any job location token
    const locationMatches = userServiceTokens.some((userToken) =>
      jobLocationTokens.some((jobToken) =>
        jobToken.includes(userToken) || userToken.includes(jobToken)
      )
    );
    
    if (locationMatches) {
      reasons.push({ reason: "Location matches your service area" });
    } else {
      // Location doesn't match, but don't fail the match entirely
      // (user might still want to see jobs outside their area)
      reasons.push({ reason: "Location may be outside your service area" });
    }
  }
  
  return {
    matches,
    reasons,
  };
}

