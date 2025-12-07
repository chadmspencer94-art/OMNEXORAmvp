import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { openai } from "@/lib/openai";

/**
 * GET /api/jobs/[id]/swms
 * Returns the current SWMS text for a job if it exists
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get job ID from params
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to view SWMS for this job." },
        { status: 403 }
      );
    }

    // Return SWMS text if it exists
    return NextResponse.json(
      { success: true, swmsText: job.swmsText || null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching SWMS:", error);
    return NextResponse.json(
      { error: "Failed to fetch SWMS." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]/swms
 * Updates the SWMS text for a job (manual save)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get job ID from params
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to update SWMS for this job." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { swmsText } = body;

    if (typeof swmsText !== "string") {
      return NextResponse.json(
        { error: "Invalid request. swmsText must be a string." },
        { status: 400 }
      );
    }

    // Save SWMS to job
    job.swmsText = swmsText.trim() || null;
    await saveJob(job);

    return NextResponse.json(
      { success: true, swmsText: job.swmsText },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving SWMS:", error);
    return NextResponse.json(
      { error: "Failed to save SWMS. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/[id]/swms
 * Generates a Safe Work Method Statement (SWMS) for the specified job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get job ID from params
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to generate SWMS for this job." },
        { status: 403 }
      );
    }

    // Block clients from generating SWMS
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients can only post jobs. SWMS generation is available to verified trades and businesses." },
        { status: 403 }
      );
    }

    // Build SWMS prompt
    const systemPrompt = `You are an expert in Australian workplace health and safety (WHS) for the construction and trades industry. Your task is to generate a comprehensive Safe Work Method Statement (SWMS) for a specific job.

The SWMS must be structured clearly with the following sections:

1. **Scope of Work**
   - Brief description of the job tasks
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

5. **Tools & Equipment**
   - List all tools and equipment required
   - Include any safety requirements for tool use
   - Note any equipment that requires certification or training

6. **Step-by-Step Work Process**
   - Detailed sequence of work steps
   - Include safety controls embedded in each step
   - Reference hazards and controls from earlier sections

7. **Emergency Procedures**
   - First aid procedures
   - Emergency contact information
   - Incident reporting requirements
   - Evacuation procedures if applicable

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it professional and suitable for site use. Ensure compliance with Australian WHS standards.`;

    // Build user prompt with job details
    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks for the trade";
    
    // Include materials info if available
    let materialsInfo = "";
    if (job.aiMaterials) {
      materialsInfo = `\n\nMaterials to be used:\n${job.aiMaterials}`;
    }

    const userPrompt = `Generate a SWMS for a ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**Job Description/Scope:** ${jobScope}${materialsInfo}

Focus on common hazards and controls for this type of work in an Australian context. Be specific to the trade type and work described.`;

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const swmsContent = response.choices[0]?.message?.content || "";

    if (!swmsContent.trim()) {
      return NextResponse.json(
        { error: "Failed to generate SWMS content" },
        { status: 500 }
      );
    }

    // Save SWMS to job
    job.swmsText = swmsContent.trim();
    await saveJob(job);

    return NextResponse.json(
      { success: true, swms: swmsContent.trim() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating SWMS:", error);
    return NextResponse.json(
      { error: "Failed to generate SWMS. Please try again." },
      { status: 500 }
    );
  }
}

