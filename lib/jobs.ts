import { kv } from "./kv";
import { openai } from "./openai";

// ============================================================================
// Types
// ============================================================================

export type TradeType = "Painter" | "Plasterer" | "Carpenter" | "Electrician" | "Other";

export type JobStatus = "draft" | "ai_pending" | "ai_complete" | "ai_failed";

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
  status: JobStatus;
  aiSummary?: string;
  aiQuote?: string;
  aiScopeOfWork?: string;
  aiInclusions?: string;
  aiExclusions?: string;
  aiMaterials?: string;
  aiClientNotes?: string;
}

export interface CreateJobData {
  title: string;
  tradeType?: TradeType;
  propertyType: string;
  address?: string;
  notes?: string;
}

// ============================================================================
// AI Response Shape
// ============================================================================

interface QuoteLineItem {
  description?: string;
  rate?: string;
  total?: string;
  cost?: string;
}

interface QuoteResponse {
  labour?: QuoteLineItem;
  materials?: QuoteLineItem;
  totalEstimate?: QuoteLineItem;
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
    status: "ai_pending",
  };

  // Store the job
  await kv.set(`job:${id}`, job);

  // Add job ID to user's job list atomically using lpush
  // This prevents race conditions when multiple jobs are created concurrently
  const userJobsKey = `user:${userId}:jobs`;
  await kv.lpush(userJobsKey, id);

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
export async function getJobsForUser(userId: string): Promise<Job[]> {
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

  // Filter out any null values and sort by createdAt descending
  return jobs
    .filter((job): job is Job => job !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================================
// AI Job Pack Generator
// ============================================================================

/**
 * Generates an AI job pack for the given job
 */
export async function generateJobPack(job: Job): Promise<Job> {
  try {
    const systemPrompt = `You are an expert estimator for AUSTRALIAN residential trades, especially painters in Western Australia.
Speak in clear, practical language that tradies understand.
You provide detailed, professional job packs that help tradies win work and set clear expectations with clients.
All prices should be in Australian Dollars (AUD).
Be specific and practical - tradies need actionable information, not generic advice.`;

    const userPrompt = `Generate a complete job pack for the following job:

**Job Title:** ${job.title}
**Trade Type:** ${job.tradeType}
**Property Type:** ${job.propertyType}
**Address:** ${job.address || "Not specified"}
**Job Created:** ${job.createdAt}

**Job Details/Notes:**
${job.notes || "No additional details provided"}

Please respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just the JSON object):
{
  "summary": "A brief 2-3 sentence overview of the job for quick reference",
  "quote": {
    "labour": { "description": "Labour description", "rate": "$XX/hr", "total": "$XXXX" },
    "materials": { "description": "Materials description", "cost": "$XXXX" },
    "totalEstimate": { "description": "Total job estimate", "total": "$XXXX - $XXXX" }
  },
  "scopeOfWork": ["Step 1 description", "Step 2 description", "..."],
  "inclusions": ["Inclusion 1", "Inclusion 2", "..."],
  "exclusions": ["Exclusion 1", "Exclusion 2", "..."],
  "materials": [
    { "item": "Material name", "quantity": "Amount needed", "estimatedCost": "$XX" }
  ],
  "clientNotes": "Professional notes for the client about payment terms, timeline, and important considerations"
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
      job.aiSummary = parsed.summary ?? "";
      job.aiQuote = parsed.quote ? JSON.stringify(parsed.quote) : "";
      job.aiScopeOfWork = Array.isArray(parsed.scopeOfWork)
        ? parsed.scopeOfWork.join("\n")
        : (parsed.scopeOfWork ?? "");
      job.aiInclusions = parsed.inclusions ? parsed.inclusions.join("\n") : "";
      job.aiExclusions = parsed.exclusions ? parsed.exclusions.join("\n") : "";
      job.aiMaterials = parsed.materials ? JSON.stringify(parsed.materials) : "";
      job.aiClientNotes = parsed.clientNotes ?? "";
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

