import { kv } from "./kv";
import { openai } from "./openai";

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
  helperRatePerHour?: number | null;
  materialsAreRoughEstimate?: boolean;
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
  // Soft delete flag (job is hidden from user but data preserved)
  isDeleted?: boolean;
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
  helperRatePerHour?: number | null;
  materialsAreRoughEstimate?: boolean;
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
  helperRatePerHour?: number | null;
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
    helperRatePerHour: data.helperRatePerHour ?? null,
    materialsAreRoughEstimate: data.materialsAreRoughEstimate ?? false,
    status: "ai_pending",
    jobStatus: "pending",
    aiReviewStatus: "pending",
    clientStatus: "draft",
    clientStatusUpdatedAt: now,
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
  const userJobsKey = `user:${userId}:jobs`;
  // Use lrange to get all job IDs from the Redis list (0 to -1 means all elements)
  const jobIds = await kv.lrange<string>(userJobsKey, 0, -1);

  if (!jobIds || jobIds.length === 0) {
    return [];
  }

  // Load all jobs in parallel
  const jobs = await Promise.all(
    jobIds.map((id) => kv.get<Job>(`job:${id}`))
  );

  // Filter out any null values, filter out deleted jobs (unless includeDeleted), and sort by createdAt descending
  return jobs
    .filter((job): job is Job => job !== null)
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

// ============================================================================
// AI Job Pack Generator
// ============================================================================

/**
 * Generates an AI job pack for the given job
 */
export async function generateJobPack(job: Job): Promise<Job> {
  try {
    // Build labour rate instructions based on user-provided values or defaults
    const defaultRates: Record<TradeType, string> = {
      Painter: "$50/hr",
      Plasterer: "$55-60/hr",
      Carpenter: "$65/hr",
      Electrician: "$80-90/hr",
      Other: "$50/hr",
    };

    let labourRateInstructions = "";
    if (job.labourRatePerHour) {
      labourRateInstructions = `Use AUD $${job.labourRatePerHour}/hour as the base labour rate for this job.`;
      if (job.helperRatePerHour) {
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

    // Build pricing context section for the prompt
    const pricingContextParts: string[] = [];
    if (job.labourRatePerHour) {
      pricingContextParts.push(`Labour rate: $${job.labourRatePerHour}/hr`);
    }
    if (job.helperRatePerHour) {
      pricingContextParts.push(`Helper/2nd worker rate: $${job.helperRatePerHour}/hr`);
    }
    if (job.materialsAreRoughEstimate) {
      pricingContextParts.push(`Materials: Treat all material prices as rough estimates only`);
    }
    const pricingContext = pricingContextParts.length > 0
      ? `**Pricing Context:**\n${pricingContextParts.join("\n")}`
      : "**Pricing Context:** Use typical WA rates for this trade";

    const userPrompt = `Generate a complete job pack for this ${job.tradeType.toLowerCase()} job:

**Job Title:** ${job.title}
**Trade Type:** ${job.tradeType}
**Property Type:** ${job.propertyType}
**Location:** ${job.address || "Western Australia"}
**Job Created:** ${job.createdAt}

${pricingContext}

**Job Details/Notes:**
${job.notes || "No additional details provided"}

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
  "clientNotes": "Professional notes about payment terms (e.g. 30% deposit), expected timeline, access requirements, etc."
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "";

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
    } catch {
      // If JSON parsing fails, set summary to raw text and mark as failed
      console.warn("Failed to parse AI response as JSON");
      job.aiSummary = content;
      job.status = "ai_failed";
    }

    await saveJob(job);
    return job;
  } catch (error) {
    console.error("Error generating job pack:", error);
    job.status = "ai_failed";
    await saveJob(job);
    throw error;
  }
}

