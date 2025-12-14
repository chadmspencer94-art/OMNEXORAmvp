import { getPrisma } from "@/lib/prisma";
import { getJobById, type Job } from "@/lib/jobs";

// ============================================================================
// Scoring Constants (tweakable)
// ============================================================================

const SCORE_PRIMARY_TRADE_MATCH = 50;
const SCORE_SECONDARY_TRADE_MATCH = 30;
const SCORE_WORK_TYPE_MATCH = 20;
const SCORE_POSTCODE_SUBURB_MATCH = 20;
const SCORE_CITY_MATCH = 10;
const SCORE_LARGE_RADIUS_BONUS = 5;

const MIN_MATCH_SCORE = 1; // Only return tradies with at least this score
const MAX_RESULTS = 10; // Limit results

// ============================================================================
// Types
// ============================================================================

export type MatchedTradie = {
  userId: string;
  name: string | null;
  email: string | null;
  businessName: string | null;
  primaryTrade: string | null;
  workTypes: {
    residential: boolean;
    commercial: boolean;
    strata: boolean;
  };
  serviceAreaSummary: string | null;
  matchScore: number;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses property type string to determine work type flags
 */
function parsePropertyType(propertyType: string | undefined): {
  isResidential: boolean;
  isCommercial: boolean;
  isStrata: boolean;
} {
  if (!propertyType) {
    return { isResidential: false, isCommercial: false, isStrata: false };
  }

  const lower = propertyType.toLowerCase();
  
  return {
    isResidential: lower.includes("residential") || lower.includes("house") || lower.includes("home"),
    isCommercial: lower.includes("commercial") || lower.includes("office") || lower.includes("business"),
    isStrata: lower.includes("strata") || lower.includes("apartment") || lower.includes("unit"),
  };
}

/**
 * Extracts postcode and suburb from job address
 */
function extractLocationFromJob(job: Job): {
  postcode: string | null;
  suburb: string | null;
  city: string | null;
} {
  if (!job.address) {
    return { postcode: null, suburb: null, city: null };
  }

  // Try to extract postcode (4 digits, typically at end or after suburb)
  const postcodeMatch = job.address.match(/\b(\d{4})\b/);
  const postcode = postcodeMatch ? postcodeMatch[1] : null;

  // Try to extract suburb (word before postcode, or common suburb patterns)
  // This is basic - could be improved with a suburb/postcode database
  let suburb: string | null = null;
  if (postcode) {
    const beforePostcode = job.address.substring(0, job.address.indexOf(postcode)).trim();
    const words = beforePostcode.split(/[,\s]+/);
    if (words.length > 0) {
      suburb = words[words.length - 1]; // Last word before postcode
    }
  }

  // Try to extract city (Perth, Mandurah, etc.)
  const cityMatch = job.address.match(/\b(Perth|Mandurah|Rockingham|Baldivis|Fremantle|Joondalup)\b/i);
  const city = cityMatch ? cityMatch[1] : null;

  return { postcode, suburb, city };
}

/**
 * Checks if a postcode or suburb appears in service postcodes string
 */
function matchesServicePostcodes(
  jobPostcode: string | null,
  jobSuburb: string | null,
  servicePostcodes: string | null
): boolean {
  if (!servicePostcodes || (!jobPostcode && !jobSuburb)) {
    return false;
  }

  const normalized = servicePostcodes.toLowerCase().replace(/[,\n\r]/g, " ");
  const terms = normalized.split(/\s+/).filter((t) => t.length > 0);

  if (jobPostcode) {
    if (terms.includes(jobPostcode.toLowerCase())) {
      return true;
    }
  }

  if (jobSuburb) {
    const normalizedSuburb = jobSuburb.toLowerCase();
    if (terms.some((term) => term.includes(normalizedSuburb) || normalizedSuburb.includes(term))) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if city matches
 */
function matchesCity(jobCity: string | null, serviceAreaCity: string | null): boolean {
  if (!jobCity || !serviceAreaCity) {
    return false;
  }

  return jobCity.toLowerCase() === serviceAreaCity.toLowerCase();
}

// ============================================================================
// Main Matching Function
// ============================================================================

/**
 * Finds suitable tradies for a job based on trade, work type, and service area
 */
export async function findMatchingTradiesForJob(jobId: string): Promise<MatchedTradie[]> {
  // 1. Load the job
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // 2. Extract job requirements
  const jobTradeType = job.tradeType;
  const propertyType = parsePropertyType(job.propertyType);
  const location = extractLocationFromJob(job);

  // 3. Load all active tradie/business users
  const prisma = getPrisma();
  const tradies = await prisma.user.findMany({
    where: {
      role: {
        in: ["tradie", "builder", "business", "supplier"], // Include tradie-related roles
      },
      isBanned: false,
      accountStatus: "ACTIVE",
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      tradingName: true,
      primaryTrade: true,
      tradeTypes: true,
      doesResidential: true,
      doesCommercial: true,
      doesStrata: true,
      servicePostcodes: true,
      serviceAreaCity: true,
      serviceRadiusKm: true,
    },
  });

  // 4. Score each tradie
  const scored: MatchedTradie[] = [];

  for (const tradie of tradies) {
    // Skip the job owner (if job already belongs to a tradie)
    if (tradie.id === job.userId) {
      continue;
    }

    let matchScore = 0;

    // Trade match
    if (tradie.primaryTrade && tradie.primaryTrade === jobTradeType) {
      matchScore += SCORE_PRIMARY_TRADE_MATCH;
    } else if (tradie.tradeTypes) {
      // Check if job trade type is in secondary trades (comma-separated)
      const secondaryTrades = tradie.tradeTypes.split(/[,\n\r]+/).map((t) => t.trim().toLowerCase());
      if (secondaryTrades.includes(jobTradeType.toLowerCase())) {
        matchScore += SCORE_SECONDARY_TRADE_MATCH;
      }
    }

    // Work type match
    if (propertyType.isResidential && tradie.doesResidential) {
      matchScore += SCORE_WORK_TYPE_MATCH;
    }
    if (propertyType.isCommercial && tradie.doesCommercial) {
      matchScore += SCORE_WORK_TYPE_MATCH;
    }
    if (propertyType.isStrata && tradie.doesStrata) {
      matchScore += SCORE_WORK_TYPE_MATCH;
    }

    // Location match
    if (matchesServicePostcodes(location.postcode, location.suburb, tradie.servicePostcodes)) {
      matchScore += SCORE_POSTCODE_SUBURB_MATCH;
    } else if (matchesCity(location.city, tradie.serviceAreaCity)) {
      matchScore += SCORE_CITY_MATCH;
    }

    // Large radius bonus (willingness to travel)
    if (tradie.serviceRadiusKm && tradie.serviceRadiusKm > 10) {
      matchScore += SCORE_LARGE_RADIUS_BONUS;
    }

    // Only include tradies with positive match score
    if (matchScore >= MIN_MATCH_SCORE) {
      // Build service area summary
      let serviceAreaSummary: string | null = null;
      const parts: string[] = [];
      if (tradie.serviceAreaCity) {
        parts.push(tradie.serviceAreaCity);
      }
      if (tradie.serviceRadiusKm) {
        parts.push(`${tradie.serviceRadiusKm}km radius`);
      }
      if (tradie.servicePostcodes) {
        const postcodePreview = tradie.servicePostcodes.substring(0, 50);
        parts.push(postcodePreview + (tradie.servicePostcodes.length > 50 ? "..." : ""));
      }
      if (parts.length > 0) {
        serviceAreaSummary = parts.join(", ");
      }

      scored.push({
        userId: tradie.id,
        name: null, // We don't have a separate name field, use email or business name
        email: tradie.email,
        businessName: tradie.tradingName || tradie.businessName,
        primaryTrade: tradie.primaryTrade,
        workTypes: {
          residential: tradie.doesResidential,
          commercial: tradie.doesCommercial,
          strata: tradie.doesStrata,
        },
        serviceAreaSummary,
        matchScore,
      });
    }
  }

  // 5. Sort by match score (descending), then by business name
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    const nameA = a.businessName || a.email || "";
    const nameB = b.businessName || b.email || "";
    return nameA.localeCompare(nameB);
  });

  // 6. Limit results
  return scored.slice(0, MAX_RESULTS);
}

// ============================================================================
// Legacy Function (for existing API route)
// ============================================================================

export type MatchReason = {
  reason: string;
};

export type MatchResult = {
  matches: boolean;
  reasons: MatchReason[];
};

/**
 * Determines if a job matches a user's service area and work types
 * (Legacy function for /api/matching/jobs-for-me route)
 */
export async function doesJobMatchUser(args: {
  user: { id: string; email: string };
  job: Job;
}): Promise<MatchResult> {
  const { user, job } = args;

  // Load user from Prisma to get business profile fields
  const prisma = getPrisma();
  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      primaryTrade: true,
      tradeTypes: true,
      doesResidential: true,
      doesCommercial: true,
      doesStrata: true,
      servicePostcodes: true,
      serviceAreaCity: true,
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
  const jobTradeType = job.tradeType;
  const tradeMatches =
    (prismaUser.primaryTrade && prismaUser.primaryTrade === jobTradeType) ||
    (prismaUser.tradeTypes &&
      prismaUser.tradeTypes
        .split(/[,\n\r]+/)
        .map((t) => t.trim().toLowerCase())
        .includes(jobTradeType.toLowerCase()));

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
  const location = extractLocationFromJob(job);
  const areaMatches =
    matchesServicePostcodes(location.postcode, location.suburb, prismaUser.servicePostcodes) ||
    matchesCity(location.city, prismaUser.serviceAreaCity);

  if (!areaMatches) {
    matches = false;
    reasons.push({ reason: "Job location is outside your service area" });
  } else {
    reasons.push({ reason: "Matches your service area" });
  }

  return { matches, reasons };
}
