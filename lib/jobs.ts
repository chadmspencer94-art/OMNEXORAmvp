import { kv } from "./kv";
import { openai } from "./openai";
import { getEffectiveRates, type EffectiveRates } from "./pricing";
import type { SafeUser } from "./auth";

// Re-export EffectiveRates for use in other files
export type { EffectiveRates } from "./pricing";

// ============================================================================
// Types
// ============================================================================

export type TradeType = "Painter" | "Plasterer" | "Carpenter" | "Electrician" | "Other";

// AI generation status (tracks AI pack generation state)
export type AIGenerationStatus = "draft" | "ai_pending" | "ai_complete" | "ai_failed" | "pending_regeneration" | "generating";

// Job workflow status
export type JobWorkflowStatus = "pending" | "booked" | "completed" | "cancelled";

// AI pack review status
export type AIReviewStatus = "pending" | "confirmed";

// Keep JobStatus as alias for backwards compatibility
export type JobStatus = AIGenerationStatus;

// Client-facing status pipeline (tracks where job is in client workflow)
export type ClientStatus = "draft" | "sent" | "accepted" | "declined" | "cancelled";

export interface Job {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  tradeType: TradeType;
  propertyType: string;
  address?: string;
  notes?: string;
  // AI generation status (tracks generation state)
  status: AIGenerationStatus;
  // Job workflow status (pending, booked, completed, cancelled)
  jobStatus?: JobWorkflowStatus;
  // AI pack review status (pending, confirmed)
  aiReviewStatus?: AIReviewStatus;
  // Client details (optional for backwards compatibility with existing jobs)
  clientName?: string;
  clientEmail?: string;
  // Pricing context (optional user-provided rates)
  labourRatePerHour?: number | null;
  helperRatePerHour?: number | null; // Legacy field - kept for backwards compatibility
  helpers?: JobHelper[]; // New: array of helpers with names and rates
  materialsAreRoughEstimate?: boolean;
  // Rate template reference (optional)
  rateTemplateId?: string | null;
  // Effective rates used for this job (stored after generation)
  effectiveRates?: EffectiveRates | null;
  // Materials override (user-provided, replaces AI materials)
  materialsOverrideText?: string | null;
  // AI-generated fields
  aiSummary?: string;
  aiQuote?: string;
  aiScopeOfWork?: string;
  aiInclusions?: string;
  aiExclusions?: string;
  aiMaterials?: string;
  aiClientNotes?: string;
  // Email tracking
  sentToClientAt?: string | null;
  // Client-facing status pipeline
  clientStatus?: ClientStatus;
  clientStatusUpdatedAt?: string | null;
  // Client acceptance/decline tracking
  clientAcceptedAt?: string | null;
  clientDeclinedAt?: string | null;
  clientSignatureId?: string | null; // FK to Signature model in Prisma
  clientSignedName?: string | null;
  clientSignedEmail?: string | null;
  // Enhanced acceptance details (tied to quote version)
  clientAcceptedByName?: string | null; // typed full name as "signature"
  clientAcceptanceNote?: string | null; // optional note from client
  clientAcceptedQuoteVer?: number | null; // which quote version was accepted
  // Soft delete flag (job is hidden from user but data preserved)
  isDeleted?: boolean;
  // SWMS (Safe Work Method Statement) fields
  swmsText?: string | null;
  swmsStatus?: "NOT_STARTED" | "GENERATING" | "READY" | "FAILED" | null;
  swmsConfirmed?: boolean;
  // Document fields (variation, EOT, progress claim, handover, maintenance)
  variationText?: string | null;
  variationConfirmed?: boolean;
  eotText?: string | null;
  eotConfirmed?: boolean;
  progressClaimText?: string | null;
  progressClaimConfirmed?: boolean;
  handoverText?: string | null;
  handoverConfirmed?: boolean;
  maintenanceText?: string | null;
  maintenanceConfirmed?: boolean;
  // Scheduling fields
  scheduledStartAt?: string | null; // ISO string
  scheduledEndAt?: string | null; // ISO string
  scheduleNotes?: string | null; // Optional notes about scheduling (e.g., "Client prefers mornings", "Access via rear driveway")
  // Materials totals (aggregated from JobMaterial line items)
  materialsSubtotal?: number | null; // sum of JobMaterial lineTotals (pre-markup)
  materialsMarkupTotal?: number | null; // amount added from markup
  materialsTotal?: number | null; // final materials cost used in quotes
  // Numeric quote breakdown (optional, computed during quote generation)
  labourHoursEstimate?: number | null;
  labourSubtotal?: number | null;
  subtotal?: number | null; // labour + materials
  gstAmount?: number | null;
  totalInclGst?: number | null;
  // Applied rates snapshot (from user's Business & Rates settings at time of generation)
  appliedMarginPct?: number | null; // margin % applied to materials
  appliedDepositPct?: number | null; // deposit % requested
  appliedGstIncluded?: boolean | null; // whether GST is included in pricing
  // Quote metadata
  quoteNumber?: string | null; // e.g. "Q-2024-0012"
  quoteVersion?: number | null; // current version number (1, 2, 3, ...)
  quoteExpiryAt?: string | null; // ISO string - when the current quote expires
  quoteLastSentAt?: string | null; // ISO string - last time a quote email was sent
  // Assignment metadata (for client job assignment workflow)
  assignedByUserId?: string | null; // admin/user who assigned the job
  assignedAt?: string | null; // ISO string - when the job was assigned to a tradie
  assignmentStatus?: string | null; // e.g. "UNASSIGNED", "ASSIGNED", "DECLINED_BY_TRADIE"
  leadSource?: string | null; // e.g. "CLIENT_PORTAL", "MANUAL", etc.
  clientUserId?: string | null; // original client user ID (for client-posted jobs)
  // Client CRM link (for tradie-created jobs)
  clientId?: string | null; // FK to Client model in Prisma (for CRM linking)
}

export interface JobHelper {
  id: string; // Unique ID for this helper (for React keys)
  name?: string; // Optional helper name/role (e.g., "Second Painter", "Apprentice")
  ratePerHour: number; // Required hourly rate
}

export interface CreateJobData {
  title: string;
  tradeType?: TradeType;
  propertyType: string;
  address?: string;
  notes?: string;
  clientName?: string;
  clientEmail?: string;
  labourRatePerHour?: number | null;
  helperRatePerHour?: number | null; // Legacy - kept for backwards compatibility
  helpers?: JobHelper[]; // New: array of helpers
  materialsAreRoughEstimate?: boolean;
  rateTemplateId?: string | null;
}

export interface UpdateJobData {
  title?: string;
  tradeType?: TradeType;
  propertyType?: string;
  address?: string;
  notes?: string;
  clientName?: string;
  clientEmail?: string;
  labourRatePerHour?: number | null;
  helperRatePerHour?: number | null; // Legacy - kept for backwards compatibility
  helpers?: JobHelper[]; // New: array of helpers
  materialsAreRoughEstimate?: boolean;
}

// ============================================================================
// AI Response Shape
// ============================================================================

interface LabourQuote {
  description?: string;
  hours?: string;
  ratePerHour?: string;
  total?: string;
}

interface MaterialsQuote {
  description?: string;
  totalMaterialsCost?: string;
}

interface TotalEstimateQuote {
  description?: string;
  totalJobEstimate?: string;
}

interface QuoteResponse {
  labour?: LabourQuote;
  materials?: MaterialsQuote;
  totalEstimate?: TotalEstimateQuote;
}

interface MaterialItem {
  item: string;
  quantity?: string;
  estimatedCost?: string;
}

interface JobPackResponse {
  summary: string;
  quote?: QuoteResponse;
  scopeOfWork?: string | string[];
  inclusions?: string[];
  exclusions?: string[];
  materials?: MaterialItem[];
  clientNotes?: string;
}

// ============================================================================
// Job CRUD Functions
// ============================================================================

/**
 * Creates a new job with ai_pending status
 */
export async function createEmptyJob(
  userId: string,
  data: CreateJobData
): Promise<Job> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const job: Job = {
    id,
    userId,
    createdAt: now,
    updatedAt: now,
    title: data.title,
    tradeType: data.tradeType || "Painter",
    propertyType: data.propertyType,
    address: data.address,
    notes: data.notes,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    labourRatePerHour: data.labourRatePerHour ?? null,
    helperRatePerHour: data.helperRatePerHour ?? null, // Legacy - kept for backwards compatibility
    helpers: data.helpers && data.helpers.length > 0 ? data.helpers : undefined, // New: array of helpers
    materialsAreRoughEstimate: data.materialsAreRoughEstimate ?? false,
    rateTemplateId: data.rateTemplateId ?? null,
    status: "ai_pending",
    jobStatus: "pending",
    aiReviewStatus: "pending",
    clientStatus: "draft",
    clientStatusUpdatedAt: now,
    // Assignment fields (will be set based on job creator)
    assignedByUserId: null,
    assignedAt: null,
    assignmentStatus: null,
    leadSource: null,
    clientUserId: null,
  };

  // Store the job
  await kv.set(`job:${id}`, job);

  // Add job ID to user's job list atomically using lpush
  // This prevents race conditions when multiple jobs are created concurrently
  const userJobsKey = `user:${userId}:jobs`;
  try {
    await kv.lpush(userJobsKey, id);
  } catch (error) {
    // Rollback: delete the job to prevent orphaned entries
    await kv.del(`job:${id}`);
    throw error;
  }

  return job;
}

/**
 * Saves/updates an existing job
 */
export async function saveJob(job: Job): Promise<void> {
  job.updatedAt = new Date().toISOString();
  await kv.set(`job:${job.id}`, job);
}

/**
 * Gets a job by ID
 */
export async function getJobById(id: string): Promise<Job | null> {
  return await kv.get<Job>(`job:${id}`);
}

/**
 * Gets all jobs for a user, sorted by createdAt descending
 */
export async function getJobsForUser(userId: string, includeDeleted: boolean = false): Promise<Job[]> {
  return getJobsForUserPaginated(userId, includeDeleted).then((result) => result.items);
}

/**
 * Gets paginated jobs for a user, sorted by createdAt descending
 */
export async function getJobsForUserPaginated(
  userId: string,
  includeDeleted: boolean = false,
  page: number = 1,
  pageSize: number = 20
): Promise<{ items: Job[]; page: number; pageSize: number; totalItems: number; totalPages: number }> {
  const userJobsKey = `user:${userId}:jobs`;
  // Get all job IDs from the Redis list
  const allJobIds = await kv.lrange<string>(userJobsKey, 0, -1) || [];

  if (allJobIds.length === 0) {
    return { items: [], page, pageSize, totalItems: 0, totalPages: 0 };
  }

  // Load all jobs in parallel (we need all to filter and sort)
  const allJobs = await Promise.all(
    allJobIds.map((id) => kv.get<Job>(`job:${id}`))
  );

  // Filter out nulls and deleted jobs, then sort
  const validJobs = allJobs
    .filter((job): job is Job => job !== null)
    .filter((job) => includeDeleted || job.isDeleted !== true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalItems = validJobs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Apply pagination
  const paginatedJobs = validJobs.slice(skip, skip + take);

  return {
    items: paginatedJobs,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

/**
 * Gets all jobs for a client (by clientEmail), sorted by createdAt descending
 * This is used for client dashboards to show jobs they've posted
 * 
 * Note: This implementation scans all user job lists. In production, you'd maintain
 * a client:email:jobs index similar to user:userId:jobs for better performance.
 */
export async function getJobsForClient(clientEmail: string, includeDeleted: boolean = false): Promise<Job[]> {
  // Normalize email to lowercase for consistent matching
  const normalizedEmail = clientEmail.toLowerCase().trim();
  
  // Get all user IDs from the users:all index
  const { getAllUsers } = await import("./auth");
  const allUsers = await getAllUsers();
  
  // Collect all job IDs from all users
  const allJobIds = new Set<string>();
  for (const user of allUsers) {
    const userJobsKey = `user:${user.id}:jobs`;
    const jobIds = await kv.lrange<string>(userJobsKey, 0, -1);
    if (jobIds) {
      jobIds.forEach(id => allJobIds.add(id));
    }
  }
  
  // Load all jobs in parallel
  const allJobs = await Promise.all(
    Array.from(allJobIds).map((id) => kv.get<Job>(`job:${id}`))
  );
  
  // Filter jobs where clientEmail matches (case-insensitive)
  const clientJobs = allJobs
    .filter((job): job is Job => job !== null)
    .filter((job) => {
      if (!job.clientEmail) return false;
      return job.clientEmail.toLowerCase().trim() === normalizedEmail;
    });

  // Filter out deleted jobs (unless includeDeleted) and sort by createdAt descending
  return clientJobs
    .filter((job) => includeDeleted || job.isDeleted !== true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Soft deletes a job (sets isDeleted = true)
 * Data is preserved for potential restoration
 * @param jobId - The job's ID
 * @returns The updated job or null if not found
 */
export async function softDeleteJob(jobId: string): Promise<Job | null> {
  const job = await getJobById(jobId);
  if (!job) {
    return null;
  }

  job.isDeleted = true;
  job.updatedAt = new Date().toISOString();
  await saveJob(job);

  return job;
}

// TODO: Add admin-only restoreJob function in the future
// export async function restoreJob(jobId: string): Promise<Job | null> {
//   const job = await getJobById(jobId);
//   if (!job) return null;
//   job.isDeleted = false;
//   job.updatedAt = new Date().toISOString();
//   await saveJob(job);
//   return job;
// }

/**
 * Clones a job for a user, creating a new job with the same core details and job pack content.
 * Resets statuses, client acceptance, and signatures to safe initial states.
 * Does NOT clone safety docs, variations, or other related documents.
 * 
 * @param options - Object containing jobId and userId
 * @returns The newly created cloned job
 * @throws Error if job not found or user doesn't own the job
 */
export async function cloneJobForUser(options: {
  jobId: string;
  userId: string;
}): Promise<Job> {
  const { jobId, userId } = options;

  // 1. Load the source job and ensure it belongs to this user
  const sourceJob = await getJobById(jobId);
  if (!sourceJob) {
    throw new Error(`Job with ID ${jobId} not found`);
  }

  if (sourceJob.userId !== userId) {
    throw new Error(`User ${userId} does not own job ${jobId}`);
  }

  // 2. Build a new job data object
  const now = new Date().toISOString();
  const newId = crypto.randomUUID();
  
  // Adjust title to indicate it's a copy
  const newTitle = sourceJob.title.length > 0
    ? `${sourceJob.title} (Copy)`
    : "Untitled job (Copy)";

  // Create the cloned job
  const clonedJob: Job = {
    id: newId,
    userId: userId,
    createdAt: now,
    updatedAt: now,
    
    // Copy core fields
    title: newTitle,
    tradeType: sourceJob.tradeType,
    propertyType: sourceJob.propertyType,
    address: sourceJob.address,
    notes: sourceJob.notes,
    clientName: sourceJob.clientName,
    clientEmail: sourceJob.clientEmail,
    
    // Copy pricing context
    labourRatePerHour: sourceJob.labourRatePerHour,
    helperRatePerHour: sourceJob.helperRatePerHour, // Legacy
    helpers: sourceJob.helpers ? sourceJob.helpers.map(h => ({ ...h })) : undefined, // Deep copy helpers array
    materialsAreRoughEstimate: sourceJob.materialsAreRoughEstimate,
    rateTemplateId: sourceJob.rateTemplateId, // Copy rate template reference
    effectiveRates: sourceJob.effectiveRates,
    materialsOverrideText: sourceJob.materialsOverrideText,
    
    // Copy pricing snapshot fields (preserve calculated values)
    materialsSubtotal: sourceJob.materialsSubtotal,
    materialsMarkupTotal: sourceJob.materialsMarkupTotal,
    materialsTotal: sourceJob.materialsTotal,
    labourHoursEstimate: sourceJob.labourHoursEstimate,
    labourSubtotal: sourceJob.labourSubtotal,
    subtotal: sourceJob.subtotal,
    gstAmount: sourceJob.gstAmount,
    totalInclGst: sourceJob.totalInclGst,
    
    // Copy AI job pack content
    aiSummary: sourceJob.aiSummary,
    aiQuote: sourceJob.aiQuote,
    aiScopeOfWork: sourceJob.aiScopeOfWork,
    aiInclusions: sourceJob.aiInclusions,
    aiExclusions: sourceJob.aiExclusions,
    aiMaterials: sourceJob.aiMaterials,
    aiClientNotes: sourceJob.aiClientNotes,
    
    // Reset statuses to safe starting point
    // If AI content exists, mark as ai_complete so user can edit without regenerating
    // Otherwise, mark as draft
    status: (sourceJob.aiSummary || sourceJob.aiScopeOfWork) ? "ai_complete" : "draft",
    jobStatus: "pending",
    aiReviewStatus: "pending",
    clientStatus: "draft",
    clientStatusUpdatedAt: now,
    
    // DO NOT copy client acceptance/signature fields
    // clientAcceptedAt, clientDeclinedAt, clientSignatureId, clientSignedName, clientSignedEmail
    // are all undefined, which is correct
    
    // DO NOT copy email tracking
    // sentToClientAt is undefined
    
    // DO NOT copy SWMS
    // swmsText and swmsStatus are undefined
    
    // DO NOT copy quote metadata (reset for new job)
    // quoteNumber, quoteVersion, quoteExpiryAt, quoteLastSentAt are undefined
    
    // DO NOT copy assignment metadata (reset for new job)
    // assignedByUserId, assignedAt, assignmentStatus, leadSource, clientUserId are undefined
    
    // DO NOT copy client CRM link (will be recreated if client details are updated)
    // clientId is undefined
    
    // Soft delete flag starts as false
    isDeleted: false,
  };

  // 3. Store the new job
  await kv.set(`job:${clonedJob.id}`, clonedJob);

  // 4. Add job ID to user's job list atomically
  const userJobsKey = `user:${userId}:jobs`;
  try {
    await kv.lpush(userJobsKey, clonedJob.id);
  } catch (error) {
    // Rollback: delete the job to prevent orphaned entries
    await kv.del(`job:${clonedJob.id}`);
    throw error;
  }

  // 5. Return the new job
  return clonedJob;
}

/**
 * Gets all active jobs from all users (for matching/searching)
 * Returns jobs that are not deleted and are in a visible state
 * @param limit - Maximum number of jobs to return (default: 50)
 * @returns Array of active jobs, sorted by createdAt descending
 */
export async function getAllActiveJobs(limit: number = 50): Promise<Job[]> {
  // Get all users to find their jobs
  const { getAllUsers } = await import("./auth");
  const users = await getAllUsers();
  
  // Collect all job IDs from all users
  const allJobIds: string[] = [];
  for (const user of users) {
    const userJobsKey = `user:${user.id}:jobs`;
    const jobIds = await kv.lrange<string>(userJobsKey, 0, -1);
    if (jobIds && jobIds.length > 0) {
      allJobIds.push(...jobIds);
    }
  }
  
  if (allJobIds.length === 0) {
    return [];
  }
  
  // Load all jobs in parallel
  const jobs = await Promise.all(
    allJobIds.map((id) => kv.get<Job>(`job:${id}`))
  );
  
  // Filter out:
  // - Null values (deleted jobs)
  // - Soft-deleted jobs
  // - Jobs that are cancelled
  const activeJobs = jobs
    .filter((job): job is Job => job !== null)
    .filter((job) => job.isDeleted !== true)
    .filter((job) => job.jobStatus !== "cancelled")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
  
  return activeJobs;
}

// ============================================================================
// AI Job Pack Generator
// ============================================================================

/**
 * Generates an AI job pack for the given job
 * 
 * INTEGRATION WITH BUSINESS & RATES SETTINGS:
 * - Loads user's Business & Rates settings from Prisma (hourlyRate, defaultMarginPct, 
 *   defaultDepositPct, gstRegistered, tradeRatesJson, dayRate, calloutFee)
 * - Stores applied rates snapshot on job (appliedMarginPct, appliedDepositPct, appliedGstIncluded)
 *   only if not already set (preserves manual edits)
 * - Passes user rates into AI prompt so model uses exact rates instead of inventing values
 * - Includes deposit % and payment terms in client notes if configured
 * - Falls back to existing defaults if settings are missing (backwards compatible)
 * 
 * @param job - The job to generate a pack for
 * @param user - The user creating/owning the job (for loading business profile rates)
 */
export async function generateJobPack(job: Job, user?: SafeUser): Promise<Job> {
  // Email verification check: require verified email for job pack generation (only for paid users)
  // Free users can generate but cannot save client details or send to clients
  if (user) {
    const { hasPaidPlan } = await import("./planChecks");
    const { isAdmin } = await import("./auth");
    
    // Only require email verification for paid users (not free users or admins)
    if (hasPaidPlan(user) && !isAdmin(user)) {
      try {
        const { requireVerifiedEmail } = await import("./authChecks");
        await requireVerifiedEmail(user);
      } catch (error: any) {
        if (error.name === "EmailNotVerifiedError") {
          throw new Error("EMAIL_NOT_VERIFIED: Please verify your email before generating job packs.");
        }
        throw error;
      }
    }
  }
  try {
    // Get effective rates (job override > business profile > pricing settings)
    let effectiveRates: EffectiveRates = {};
    if (user) {
      effectiveRates = await getEffectiveRates({ user, job });
      // Store effective rates on the job for future reference
      job.effectiveRates = effectiveRates;
      
      // Store applied rates snapshot on job (only if not already set - preserve manual edits)
      if (job.appliedMarginPct == null && effectiveRates.defaultMarginPct != null) {
        job.appliedMarginPct = effectiveRates.defaultMarginPct;
      }
      if (job.appliedDepositPct == null && effectiveRates.defaultDepositPct != null) {
        job.appliedDepositPct = effectiveRates.defaultDepositPct;
      }
      if (job.appliedGstIncluded == null && effectiveRates.gstRegistered != null) {
        job.appliedGstIncluded = effectiveRates.gstRegistered;
      }
    }

    // Build labour rate instructions based on effective rates or defaults
    const defaultRates: Record<TradeType, string> = {
      Painter: "$50/hr",
      Plasterer: "$55-60/hr",
      Carpenter: "$65/hr",
      Electrician: "$80-90/hr",
      Other: "$50/hr",
    };

    let labourRateInstructions = "";
    if (effectiveRates.hourlyRate) {
      labourRateInstructions = `Use AUD $${effectiveRates.hourlyRate}/hour as the base labour rate for this job.`;
      // Handle multiple helpers from job.helpers array
      if (job.helpers && job.helpers.length > 0) {
        const helperDescriptions = job.helpers.map((h, idx) => {
          const helperName = h.name ? ` (${h.name})` : "";
          return `Helper ${idx + 1}${helperName}: AUD $${h.ratePerHour}/hour`;
        }).join(", ");
        labourRateInstructions += ` Additional helpers: ${helperDescriptions}.`;
      } else if (effectiveRates.helperHourlyRate) {
        // Fallback to legacy helperHourlyRate
        labourRateInstructions += ` Assume a second worker at AUD $${effectiveRates.helperHourlyRate}/hour where needed.`;
      }
    } else if (job.labourRatePerHour) {
      // Fallback to job override if effective rates not available
      labourRateInstructions = `Use AUD $${job.labourRatePerHour}/hour as the base labour rate for this job.`;
      // Handle multiple helpers from job.helpers array
      if (job.helpers && job.helpers.length > 0) {
        const helperDescriptions = job.helpers.map((h, idx) => {
          const helperName = h.name ? ` (${h.name})` : "";
          return `Helper ${idx + 1}${helperName}: AUD $${h.ratePerHour}/hour`;
        }).join(", ");
        labourRateInstructions += ` Additional helpers: ${helperDescriptions}.`;
      } else if (job.helperRatePerHour) {
        // Fallback to legacy helperRatePerHour
        labourRateInstructions += ` Assume a second worker at AUD $${job.helperRatePerHour}/hour where needed.`;
      }
    } else {
      labourRateInstructions = `No specific labour rate was provided. Use realistic WA rates based on trade type:
- Painter: $50/hr
- Plasterer: $55-60/hr
- Carpenter: $65/hr
- Electrician: $80-90/hr
For this ${job.tradeType} job, use approximately ${defaultRates[job.tradeType]}.`;
    }

    // Build materials disclaimer instructions
    let materialsInstructions = `Material pricing MUST be clearly labelled as an estimate only. The tradie will check current supplier prices.`;
    if (job.materialsAreRoughEstimate) {
      materialsInstructions += `
IMPORTANT: Emphasise that material costs are a rough estimate. Add a clear statement: "Material prices are approximate only and must be confirmed against current supplier pricing (e.g. Dulux/Bunnings)."`;
    }

    const systemPrompt = `You are an expert ${job.tradeType.toLowerCase()} estimator based in Western Australia, working across Perth, Mandurah, Baldivis, Rockingham and surrounding areas.

LABOUR RATE GUIDELINES:
${labourRateInstructions}
- Always show HOURS first, then calculate: hours × rate = total
- Be realistic - no lowball estimates that make tradies look bad
- Include adequate prep time for rough surfaces, patching, sanding, etc.

MATERIALS GUIDELINES:
${materialsInstructions}

PAINT PRODUCTS (default to Dulux unless notes specify otherwise):
- Walls: Dulux Wash & Wear (low sheen or matt)
- Ceilings: Dulux Ceiling White (flat)
- Trim/doors: Dulux Aquanamel (semi-gloss or gloss)
- Exteriors: Dulux Weathershield

ESTIMATING TIPS:
- Average room (3x4m): 4-6 hours for 2 coats walls + ceiling
- Full repaint 3x2 house: 40-60 hours depending on condition
- Add 20-30% more time if surfaces need significant prep
- Factor in cut-in time for edges and corners

Speak in clear, practical language that Aussie tradies understand. No fluff - just actionable info.`;

    // Build pricing context section for the prompt using effective rates
    const pricingContextParts: string[] = [];
    
    // Use effective rates if available, otherwise fall back to job overrides
    const hourlyRate = effectiveRates.hourlyRate ?? job.labourRatePerHour;
    const helperRate = effectiveRates.helperHourlyRate ?? job.helperRatePerHour;
    const dayRate = effectiveRates.dayRate;
    const ratePerM2Interior = effectiveRates.ratePerM2Interior;
    const ratePerM2Exterior = effectiveRates.ratePerM2Exterior;
    const ratePerLmTrim = effectiveRates.ratePerLmTrim;
    const calloutFee = effectiveRates.calloutFee;
    const materialMarkup = effectiveRates.materialMarkupPercent ?? effectiveRates.defaultMarginPct;
    const depositPct = effectiveRates.defaultDepositPct;
    const gstRegistered = effectiveRates.gstRegistered;
    const paymentTerms = effectiveRates.defaultPaymentTerms;

    // Core rates
    if (hourlyRate) {
      pricingContextParts.push(`Hourly rate: $${hourlyRate}/hr`);
    }
    if (dayRate) {
      pricingContextParts.push(`Day rate: $${dayRate}/day`);
    }
    if (helperRate) {
      pricingContextParts.push(`Helper/2nd worker rate: $${helperRate}/hr`);
    }
    if (calloutFee) {
      pricingContextParts.push(`Callout fee: $${calloutFee}`);
    }
    
    // Trade-specific rates (painter focus)
    if (ratePerM2Interior) {
      pricingContextParts.push(`Interior rate: $${ratePerM2Interior}/m²`);
    }
    if (ratePerM2Exterior) {
      pricingContextParts.push(`Exterior rate: $${ratePerM2Exterior}/m²`);
    }
    if (ratePerLmTrim) {
      pricingContextParts.push(`Linear metre rate (trim/handrail): $${ratePerLmTrim}/lm`);
    }
    
    // Painter-specific rates from tradeRatesJson
    if (effectiveRates.tradeRates?.painter) {
      const painterRates = effectiveRates.tradeRates.painter;
      if (painterRates.wallsPerM2) {
        pricingContextParts.push(`Walls per m²: $${painterRates.wallsPerM2}/m²`);
      }
      if (painterRates.ceilingsPerM2) {
        pricingContextParts.push(`Ceilings per m²: $${painterRates.ceilingsPerM2}/m²`);
      }
      if (painterRates.trimPerM) {
        pricingContextParts.push(`Trim per metre: $${painterRates.trimPerM}/m`);
      }
      if (painterRates.doorsEach) {
        pricingContextParts.push(`Doors each: $${painterRates.doorsEach}`);
      }
    }
    
    // Pricing defaults
    if (materialMarkup !== undefined && materialMarkup !== null) {
      pricingContextParts.push(`Margin on materials: ${materialMarkup}%`);
    }
    if (depositPct !== undefined && depositPct !== null) {
      pricingContextParts.push(`Typical deposit: ${depositPct}%`);
    }
    if (gstRegistered) {
      pricingContextParts.push(`GST registered: Yes (prices include GST)`);
    }
    if (paymentTerms) {
      pricingContextParts.push(`Payment terms: ${paymentTerms}`);
    }
    if (job.materialsAreRoughEstimate) {
      pricingContextParts.push(`Materials: Treat all material prices as rough estimates only`);
    }
    
    const pricingContext = pricingContextParts.length > 0
      ? `**Pricing Context - USE THESE EXACT RATES:**\n${pricingContextParts.join("\n")}\n\nIMPORTANT: You MUST use these exact rates when calculating labour costs, materials costs, and total estimates. Do NOT invent new rates. If any rate is missing, clearly state in your response that pricing is approximate only.`
      : "**Pricing Context:** No specific rates provided. Use typical WA rates for this trade, but clearly state that all pricing is approximate and must be verified.";

    // Load job materials if they exist
    let materialsContext = "";
    if (job.materialsTotal != null && job.materialsTotal > 0) {
      const { prisma } = await import("./prisma");
      const jobMaterials = await (prisma as any).jobMaterial.findMany({
        where: {
          jobId: job.id,
          userId: job.userId,
        },
        orderBy: { createdAt: "asc" },
      });

      if (jobMaterials.length > 0) {
        const materialsList = jobMaterials
          .map((m: any) => `${m.name} (${m.quantity} ${m.unitLabel})`)
          .join(", ");
        materialsContext = `\n**Materials Total:** $${job.materialsTotal.toFixed(2)}\n**Materials List:** ${materialsList}`;
      }
    }

    // Load attachments with captions for additional context
    let attachmentsContext = "";
    try {
      const { prisma } = await import("./prisma");
      const attachments = await (prisma as any).jobAttachment.findMany({
        where: {
          jobId: job.id,
          userId: job.userId,
        },
        select: {
          fileName: true,
          kind: true,
          caption: true,
        },
        take: 10, // sanity limit
        orderBy: { createdAt: "desc" },
      });

      if (attachments.length > 0) {
        const attachmentLines = attachments
          .filter((a: any) => a.caption) // Only include attachments with captions
          .map((a: any) => `- Attachment: ${a.fileName}, Kind: ${a.kind}, Caption: "${a.caption}"`)
          .join("\n");

        if (attachmentLines) {
          attachmentsContext = `\n\n**Additional site context from attachments (text only, no images processed):**\n${attachmentLines}`;
        }
      }
    } catch (error) {
      // Log but don't fail job pack generation if attachment loading fails
      console.warn("Failed to load attachments for AI context:", error);
    }

    // Build client notes guidance including deposit and payment terms
    let clientNotesGuidance = "";
    
    if (depositPct !== undefined && depositPct !== null) {
      clientNotesGuidance += `\n- Include payment terms: ${depositPct}% deposit required upfront, balance on completion.`;
    }
    if (paymentTerms) {
      clientNotesGuidance += `\n- Payment terms: ${paymentTerms}.`;
    }
    if (!depositPct && !paymentTerms) {
      clientNotesGuidance += `\n- Include standard payment terms (e.g. deposit required, balance on completion).`;
    }

    const userPrompt = `Generate a complete job pack for this ${job.tradeType.toLowerCase()} job:

**Job Title:** ${job.title}
**Trade Type:** ${job.tradeType}${materialsContext}
**Property Type:** ${job.propertyType}
**Location:** ${job.address || "Western Australia"}
**Job Created:** ${job.createdAt}

${pricingContext}

**Job Details/Notes:**
${job.notes || "No additional details provided"}${attachmentsContext}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "Brief 2-3 sentence overview of the job",
  "quote": {
    "labour": {
      "description": "What the labour covers (e.g. 2 painters, prep, 2 coats all surfaces)",
      "hours": "XX hours",
      "ratePerHour": "$50/hr" or "$100/hr for 2 painters",
      "total": "$XXXX"
    },
    "materials": {
      "description": "Paint and materials summary",
      "totalMaterialsCost": "$XXX"
    },
    "totalEstimate": {
      "description": "Complete job including labour and materials",
      "totalJobEstimate": "$X,XXX - $X,XXX"
    }
  },
  "scopeOfWork": ["Prep: wash/sand/fill as needed", "Prime bare areas", "2 coats walls", "2 coats ceilings", "..."],
  "inclusions": ["All paint and materials", "Surface preparation", "Drop sheets and protection", "..."],
  "exclusions": ["Furniture removal", "Repairs beyond minor patching", "..."],
  "materials": [
    { "item": "Dulux Wash & Wear 10L", "quantity": "2", "estimatedCost": "$350" },
    { "item": "Dulux Ceiling White 10L", "quantity": "1", "estimatedCost": "$120" }
  ],
  "clientNotes": "Professional notes about payment terms${depositPct ? ` (${depositPct}% deposit required)` : ""}, expected timeline, access requirements, etc.${clientNotesGuidance}"
}

IMPORTANT REMINDERS:
- All pricing is ESTIMATE ONLY. The tradie must verify quantities and current supplier prices before sending to client.
- Material prices are approximate and must be checked against current supplier pricing (e.g. Dulux/Bunnings).
- Labour hours are estimates based on typical work - actual time may vary.
- The client must understand this is a quote/estimate, not a fixed price, until quantities are confirmed on site.`;

    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      throw new Error(`AI service error: ${apiError?.message || "Failed to connect to AI service. Please try again."}`);
    }

    if (!response?.choices || response.choices.length === 0) {
      throw new Error("AI service returned an invalid response. Please try again.");
    }

    const content = response.choices[0]?.message?.content || "";

    if (!content || content.trim().length === 0) {
      throw new Error("AI returned empty response. Please try again.");
    }

    // Try to parse the JSON response
    try {
      // Clean up potential markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const parsed: JobPackResponse = JSON.parse(cleanContent);

      // Map parsed fields onto the job with proper type handling
      // All string fields must be validated to prevent runtime errors if AI returns wrong types
      job.aiSummary = typeof parsed.summary === "string" ? parsed.summary : "";
      job.aiQuote = parsed.quote ? JSON.stringify(parsed.quote) : "";
      job.aiScopeOfWork = Array.isArray(parsed.scopeOfWork)
        ? parsed.scopeOfWork.join("\n")
        : (typeof parsed.scopeOfWork === "string" ? parsed.scopeOfWork : "");
      job.aiInclusions = Array.isArray(parsed.inclusions)
        ? parsed.inclusions.join("\n")
        : (typeof parsed.inclusions === "string" ? parsed.inclusions : "");
      job.aiExclusions = Array.isArray(parsed.exclusions)
        ? parsed.exclusions.join("\n")
        : (typeof parsed.exclusions === "string" ? parsed.exclusions : "");
      job.aiMaterials = Array.isArray(parsed.materials)
        ? JSON.stringify(parsed.materials)
        : (typeof parsed.materials === "string" ? parsed.materials : "");
      job.aiClientNotes = typeof parsed.clientNotes === "string" ? parsed.clientNotes : "";
      job.status = "ai_complete";
    } catch (parseError: any) {
      // If JSON parsing fails, throw a more descriptive error
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("AI response content:", content.substring(0, 500));
      throw new Error(`Failed to parse AI response. The AI may have returned invalid JSON. Please try again.`);
    }

    await saveJob(job);
    return job;
  } catch (error: any) {
    console.error("Error generating job pack:", error);
    
    // Preserve specific error messages
    if (error?.message?.includes("EMAIL_NOT_VERIFIED")) {
      job.status = "ai_failed";
      await saveJob(job);
      throw error; // Re-throw email verification errors as-is
    }
    
    // For other errors, provide a more helpful message
    const errorMessage = error?.message || "An unexpected error occurred while generating the job pack";
    job.status = "ai_failed";
    await saveJob(job);
    throw new Error(errorMessage);
  }
}

/**
 * Generates a SWMS (Safe Work Method Statement) for the given job
 * @param job - The job to generate a SWMS for
 * @param user - The user creating/owning the job (for loading business profile)
 */
export async function generateSWMS(job: Job, user?: SafeUser): Promise<Job> {
  try {
    // Set status to generating
    job.swmsStatus = "GENERATING";
    await saveJob(job);

    // Load user business profile from Prisma if available
    let userPrimaryTrade: string | null = null;
    let userTradeTypes: string | null = null;
    
    if (user) {
      try {
        const { prisma } = await import("./prisma");
        const prismaUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (prismaUser) {
          // Type assertion needed because Prisma types may not be fully up to date
          const userData = prismaUser as any;
          userPrimaryTrade = userData.primaryTrade || null;
          userTradeTypes = userData.tradeTypes || null;
        }
      } catch (error) {
        console.warn("Failed to load Prisma user for SWMS:", error);
      }
    }

    const tradeType = userPrimaryTrade || job.tradeType;
    const tradeTypes = userTradeTypes ? userTradeTypes.split(",").map(t => t.trim()).join(", ") : null;

    const systemPrompt = `You are an expert safety consultant specialising in Australian construction and trades work safety compliance. You create comprehensive Safe Work Method Statements (SWMS) that comply with Australian Work Health and Safety (WHS) regulations.

Your SWMS documents must be:
- Clear, structured, and professional
- Compliant with Australian WHS standards
- Specific to the trade and work type described
- Practical and actionable for tradies on site
- Well-formatted with clear headings and sections

Format your response as structured text with clear sections using headings and bullet points.`;

    const userPrompt = `Generate a comprehensive Safe Work Method Statement (SWMS) for this ${job.tradeType.toLowerCase()} job:

**Job Title:** ${job.title}
**Trade Type:** ${job.tradeType}${tradeTypes ? ` (Specialisations: ${tradeTypes})` : ""}
**Property Type:** ${job.propertyType}
**Location:** ${job.address || "Western Australia"}

${job.aiScopeOfWork ? `**Scope of Work:**\n${job.aiScopeOfWork}` : ""}

${job.notes ? `**Additional Job Details:**\n${job.notes}` : ""}

Create a complete SWMS document with the following sections:

1. **Scope of Works**
   - Clear description of the work to be performed
   - Location and site details
   - Duration and timing considerations

2. **Key Hazards**
   - List all identified hazards relevant to this trade and work type
   - Include physical, chemical, environmental, and ergonomic hazards
   - Be specific to the work described

3. **Risk Controls**
   - For each hazard, specify control measures
   - Include engineering controls, administrative controls, and PPE
   - Reference Australian standards where relevant

4. **Personal Protective Equipment (PPE) Required**
   - List all required PPE items
   - Specify when and where each item must be worn
   - Include any special requirements

5. **Step-by-Step Work Process**
   - Detailed sequence of work steps
   - Include safety controls embedded in each step
   - Reference hazards and controls from earlier sections

6. **Emergency Procedures**
   - First aid procedures
   - Emergency contact information
   - Incident reporting requirements
   - Evacuation procedures if applicable

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it professional and suitable for site use.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || "";

    if (content.trim()) {
      job.swmsText = content.trim();
      job.swmsStatus = "READY";
    } else {
      job.swmsStatus = "FAILED";
    }

    await saveJob(job);
    return job;
  } catch (error) {
    console.error("Error generating SWMS:", error);
    job.swmsStatus = "FAILED";
    await saveJob(job);
    throw error;
  }
}

