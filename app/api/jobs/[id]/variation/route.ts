import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { openai } from "@/lib/openai";

/**
 * POST /api/jobs/[id]/variation
 * Generates a Variation / Change Order document for the specified job
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
        { error: "Forbidden. You don't have permission to generate documents for this job." },
        { status: 403 }
      );
    }

    // Block clients from generating documents
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients can only post jobs. Document generation is available to verified trades and businesses." },
        { status: 403 }
      );
    }

    // Load business profile data if available
    let businessName = "";
    let abn = "";
    try {
      const { prisma } = await import("@/lib/prisma");
      const prismaUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          businessName: true,
          abn: true,
        },
      });
      if (prismaUser) {
        businessName = prismaUser.businessName || "";
        abn = prismaUser.abn || "";
      }
    } catch {
      // Continue without business profile data
    }

    // Build Variation prompt
    const systemPrompt = `You are an expert in Australian construction and trades contract administration. Your task is to generate a professional Variation / Change Order document for a specific job.

The Variation document must be structured clearly with the following sections:

1. **Job and Contractor Details**
   - Job title and reference
   - Contractor business name and ABN (if available)
   - Client name and contact details
   - Property address

2. **Reference to Original Quote/Job**
   - Reference to the original job/quote
   - Date of original quote
   - Brief description of original scope

3. **Description of Variation**
   - Clear description of the change in scope
   - What is being added, removed, or modified
   - Specific details of the variation

4. **Reason for Variation**
   - Explanation of why the variation is required
   - Client request, site conditions, or other factors

5. **Cost Impact**
   - Additional cost or credit amount
   - Breakdown if applicable
   - GST implications
   - Use placeholders like "[Amount to be confirmed]" if exact figures are not available

6. **Time Impact**
   - Number of additional days required (if any)
   - Impact on completion date
   - Revised completion date if applicable

7. **Signature/Acceptance Section**
   - Contractor signature line with name and date
   - Client signature line with name and date
   - Space for acceptance/rejection

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it professional and suitable for Australian residential/commercial construction context.`;

    // Build user prompt with job details
    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks for the trade";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "Client details not specified";
    
    // Get pricing info if available
    let pricingInfo = "";
    if (job.aiQuote) {
      try {
        const quote = JSON.parse(job.aiQuote);
        if (quote.totalEstimate?.totalJobEstimate) {
          pricingInfo = `\n\nOriginal quote estimate: ${quote.totalEstimate.totalJobEstimate}`;
        }
      } catch {
        // Ignore parse errors
      }
    }

    const userPrompt = `Generate a Variation / Change Order document for a ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**${clientInfo}**
**Original Job Description/Scope:** ${jobScope}${pricingInfo}
${businessName ? `**Contractor Business Name:** ${businessName}` : ""}
${abn ? `**ABN:** ${abn}` : ""}

Create a professional Variation document that clearly outlines the change in scope, cost impact, and time implications. Use Australian construction terminology and formatting.`;

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

    const documentContent = response.choices[0]?.message?.content || "";

    if (!documentContent.trim()) {
      return NextResponse.json(
        { error: "Failed to generate Variation document" },
        { status: 500 }
      );
    }

    // Save document as draft (not confirmed)
    job.variationText = documentContent.trim();
    job.variationConfirmed = false;
    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        title: `Variation – ${job.title}`,
        body: documentContent.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating Variation:", error);
    return NextResponse.json(
      { error: "Failed to generate Variation document. Please try again." },
      { status: 500 }
    );
  }
}

