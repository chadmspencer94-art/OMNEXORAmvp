import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { requireVerifiedUser, UserNotVerifiedError } from "@/lib/authChecks";
import { getJobById, saveJob } from "@/lib/jobs";
import { openai, isOpenAIAvailable } from "@/lib/openai";

/**
 * POST /api/jobs/[id]/maintenance
 * Generates a Maintenance & Care Guide for the specified job
 * 
 * VERIFICATION GATE: Requires business verification before generating documents.
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

    // VERIFICATION GATE: Require business verification before document generation
    try {
      await requireVerifiedUser(user);
    } catch (error) {
      if (error instanceof UserNotVerifiedError) {
        return NextResponse.json(
          { error: error.message, code: "VERIFICATION_REQUIRED" },
          { status: 403 }
        );
      }
      throw error;
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
        { error: "Forbidden. You don't have permission to generate documents for this job." },
        { status: 403 }
      );
    }

    // Block clients from generating documents
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients can only post jobs. Document generation is available to structured trades and businesses." },
        { status: 403 }
      );
    }

    // Check if OpenAI is available
    if (!isOpenAIAvailable()) {
      return NextResponse.json(
        { error: "AI service is not available. Please contact support." },
        { status: 503 }
      );
    }

    // Load business profile data if available
    let businessName = "";
    try {
      const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          businessName: true,
        },
      });
      if (prismaUser) {
        businessName = prismaUser.businessName || "";
      }
    } catch {
      // Continue without business profile data
    }

    // Build Maintenance Guide prompt
    const systemPrompt = `You are an expert in Australian construction and trades maintenance and care guidance. Your task is to generate a comprehensive Maintenance & Care Guide for a specific job.

The Maintenance Guide must be structured clearly with the following sections:

1. **Overview of Works Performed**
   - Brief summary of what work was completed
   - Specific details relevant to the trade (e.g., "Internal repaint of 3x2 with low-sheen walls and semi-gloss trims")
   - Materials used (if relevant)

2. **Cleaning and Care**
   - How to clean the completed work
   - Recommended cleaning products and methods
   - What products to avoid (e.g., harsh chemicals, abrasive cleaners)
   - Frequency of cleaning recommendations

3. **Touch-Up Guidance**
   - How and when to touch up small marks or scratches
   - Recommended touch-up products
   - Step-by-step touch-up instructions
   - When professional touch-ups may be needed

4. **Recommended Recoat Intervals**
   - Interior work: typically 5-7 years (or trade-specific guidance)
   - Exterior work: more frequent intervals based on exposure
   - Factors affecting recoat timing (weather, usage, exposure)

5. **Moisture/Ventilation/UV Considerations**
   - Moisture management (if applicable)
   - Ventilation requirements
   - UV protection considerations
   - Climate-specific advice for Australian conditions

6. **Simple Warranty Summary**
   - What is typically covered (workmanship, materials)
   - What is not covered (damage from impact, moisture ingress, neglect, etc.)
   - How to report issues
   - Keep it simple and non-legal, but clear

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it practical, easy to understand, and suitable for Australian residential context. Focus on helping the client maintain their investment.`;

    // Build user prompt with job details
    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks for the trade";
    
    // Include materials info if available
    let materialsInfo = "";
    if (job.aiMaterials) {
      try {
        const materials = JSON.parse(job.aiMaterials);
        if (Array.isArray(materials)) {
          materialsInfo = `\n\nMaterials used:\n${materials.map((m: any) => `- ${m.item || m}`).join("\n")}`;
        } else {
          materialsInfo = `\n\nMaterials: ${job.aiMaterials}`;
        }
      } catch {
        materialsInfo = `\n\nMaterials: ${job.aiMaterials}`;
      }
    } else if (job.materialsOverrideText) {
      materialsInfo = `\n\nMaterials: ${job.materialsOverrideText}`;
    }

    // Include summary if available
    let summaryInfo = "";
    if (job.aiSummary) {
      summaryInfo = `\n\nWork Summary: ${job.aiSummary}`;
    }

    const userPrompt = `Generate a Maintenance & Care Guide for a ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**Scope of Work:** ${jobScope}${summaryInfo}${materialsInfo}
${businessName ? `**Contractor:** ${businessName}` : ""}

Create a comprehensive maintenance guide that is specific to ${tradeInfo} work. Include practical, easy-to-follow advice for Australian conditions. Focus on helping the client maintain the completed work.`;

    // Call OpenAI
    let documentContent = "";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      documentContent = response.choices[0]?.message?.content || "";

      if (!documentContent.trim()) {
        return NextResponse.json(
          { error: "Failed to generate Maintenance Guide. No content received from AI service." },
          { status: 500 }
        );
      }
    } catch (openaiError: any) {
      console.error("[maintenance] OpenAI API error:", openaiError);
      if (openaiError?.message?.includes("API key") || openaiError?.code === "invalid_api_key") {
        return NextResponse.json(
          { error: "AI service is not available. Please contact support." },
          { status: 503 }
        );
      }
      throw openaiError; // Re-throw to be caught by outer catch
    }

    // Save document as draft (not confirmed)
    job.maintenanceText = documentContent.trim();
    job.maintenanceConfirmed = false;
    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        title: `Maintenance & Care Guide – ${job.title}`,
        body: documentContent.trim(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[maintenance] Error generating Maintenance Guide:", error);
    
    // If it's already a handled OpenAI error, return it
    if (error?.message && (error.message.includes("AI service") || error.message.includes("API key"))) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    
    // Generic error fallback
    return NextResponse.json(
      { error: error?.message || "Failed to generate Maintenance Guide. Please try again." },
      { status: 500 }
    );
  }
}

