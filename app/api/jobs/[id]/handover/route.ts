import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { openai } from "@/lib/openai";

/**
 * POST /api/jobs/[id]/handover
 * Generates a Handover & Practical Completion checklist for the specified job
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
        { error: "Clients can only post jobs. Document generation is available to structured trades and businesses." },
        { status: 403 }
      );
    }

    // Load business profile data if available
    let businessName = "";
    try {
      const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
      const prismaUser = await prisma.user.findUnique({
        where: { id: user.id },
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

    // Build Handover prompt
    const systemPrompt = `You are an expert in Australian construction and trades project completion and handover procedures. Your task is to generate a professional Handover & Practical Completion checklist for a specific job.

The Handover document must be structured clearly with the following sections:

1. **Job Details**
   - Project/job title
   - Property address
   - Client name and contact details
   - Trade type

2. **Statement of Practical Completion**
   - Clear statement that works are practically complete subject to minor defects
   - Reference to Australian construction standards
   - Date of practical completion

3. **Checklist Items**
   Create a comprehensive checklist relevant to the trade type, including items such as:
   - All areas completed as per scope
   - Surfaces cleaned and prepared
   - Rubbish and materials removed
   - Client walkthrough completed
   - Touch-ups completed (if applicable)
   - Keys/fobs/access returned (if applicable)
   - Final inspection completed
   - Any trade-specific completion items

4. **Space for Client Comments**
   - Section for client to note any defects or concerns
   - Space for additional notes

5. **Practical Completion Date**
   - Date field for recording completion date

6. **Signature Lines**
   - Contractor signature line with name and date
   - Client signature line with name and date
   - Space for acknowledgment of practical completion

Format the response as clear, structured text with section headings. Use checkboxes (☐) for checklist items. Make it professional and suitable for Australian residential/commercial construction context.`;

    // Build user prompt with job details
    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "Client details not specified";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks for the trade";
    
    // Include inclusions/exclusions if available
    let inclusionsInfo = "";
    if (job.aiInclusions) {
      inclusionsInfo = `\n\nIncluded items:\n${job.aiInclusions}`;
    }

    const userPrompt = `Generate a Handover & Practical Completion checklist for a ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**${clientInfo}**
**Scope of Work:** ${jobScope}${inclusionsInfo}
${businessName ? `**Contractor Business Name:** ${businessName}` : ""}

Create a comprehensive handover checklist that is specific to ${tradeInfo} work. Include all relevant completion items for this trade type. Use Australian construction terminology and formatting.`;

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
        { error: "Failed to generate Handover checklist" },
        { status: 500 }
      );
    }

    // Save document as draft (not confirmed)
    job.handoverText = documentContent.trim();
    job.handoverConfirmed = false;
    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        title: `Handover & Practical Completion – ${job.title}`,
        body: documentContent.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating Handover:", error);
    return NextResponse.json(
      { error: "Failed to generate Handover checklist. Please try again." },
      { status: 500 }
    );
  }
}

