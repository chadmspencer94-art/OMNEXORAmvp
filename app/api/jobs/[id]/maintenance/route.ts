import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { openai } from "@/lib/openai";

/**
 * POST /api/jobs/[id]/maintenance
 * Generates a Maintenance & Care Guide for the specified job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to generate this document." },
        { status: 403 }
      );
    }

    const systemPrompt = `You are an expert in Australian construction and trades maintenance and care. Generate a professional Maintenance & Care Guide for completed work.

The document must be structured clearly with the following sections:

1. **Overview of Works Performed**
   - Brief summary of what was completed
   - Example: "Internal repaint of 3x2 with low-sheen walls and semi-gloss trims"
   - Reference to specific areas or surfaces

2. **Cleaning and Care**
   - How to clean painted/finished surfaces
   - Recommended cleaning products and methods
   - What products to avoid (e.g., harsh chemicals, abrasive cleaners)
   - Frequency of cleaning

3. **Touch-up Guidance**
   - How and when to touch up small marks or scuffs
   - Recommended touch-up products
   - When professional touch-ups may be needed

4. **Recoat Intervals**
   - Recommended recoat intervals (e.g., 5-7 years for interiors, more frequent for exteriors)
   - Factors that affect recoat timing
   - Signs that recoating may be needed

5. **Moisture/Ventilation/UV Considerations**
   - Moisture management (especially for bathrooms, kitchens)
   - Ventilation requirements
   - UV protection (for exteriors)
   - Climate considerations for Australian conditions

6. **Warranty Summary** (simple, non-legal)
   - What is typically covered (e.g., defects in workmanship, premature failure)
   - What is not covered (e.g., damage from impact, moisture, neglect, normal wear and tear)
   - How to report issues
   - Note that this is a general guide, not a legal warranty document

Format as clear, structured text with headings and bullet points. Use Australian terminology and context. Make it practical and easy to understand for homeowners.`;

    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks";
    const materialsInfo = job.aiMaterials || job.materialsOverrideText || "";

    const userPrompt = `Generate a Maintenance & Care Guide for this ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**Work Completed:** ${jobScope}
${materialsInfo ? `**Materials Used:** ${materialsInfo}` : ""}

Generate a complete maintenance and care guide. Be specific to ${tradeInfo} work and Australian residential context. Include practical, actionable advice for homeowners.`;

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

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Failed to generate maintenance guide" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        title: `Maintenance & Care Guide – ${job.title}`,
        body: content.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating maintenance guide:", error);
    return NextResponse.json(
      { error: "Failed to generate maintenance guide. Please try again." },
      { status: 500 }
    );
  }
}

