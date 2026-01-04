import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { openai } from "@/lib/openai";

/**
 * POST /api/jobs/[id]/eot
 * Generates an Extension of Time (EOT) notice for the specified job
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
    let abn = "";
    try {
      const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
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

    // Build EOT prompt
    const systemPrompt = `You are an expert in Australian construction and trades contract administration. Your task is to generate a professional Extension of Time (EOT) notice for a specific job.

The EOT notice must be structured clearly with the following sections:

1. **Job and Contractor Details**
   - Job title and reference
   - Contractor business name and ABN (if available)
   - Client name and contact details
   - Property address

2. **Cause of Delay**
   - Clear description of the cause(s) of delay
   - Common causes include: weather conditions, client delays, access issues, supplier/material delays, unforeseen site conditions, variations, etc.
   - Be specific and factual

3. **Period of Extension Requested**
   - Number of additional days requested
   - Clear statement of the extension period

4. **Indicative Revised Completion Date**
   - Calculate and state the revised completion date
   - Note that this is indicative and subject to confirmation
   - Reference the original completion date if available

5. **Statement Referencing Fair and Reasonable Adjustment**
   - Statement that the extension is a fair and reasonable adjustment to the program
   - Reference to Australian construction industry standards
   - Professional and courteous tone

6. **Signature Section**
   - Contractor signature line with name and date
   - Space for client acknowledgment

Format the response as clear, structured text with section headings. Use bullet points where appropriate. Make it professional and suitable for Australian residential/commercial construction context.`;

    // Build user prompt with job details
    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "Client details not specified";
    
    // Calculate dates (rough estimate)
    const createdAt = new Date(job.createdAt);
    const estimatedCompletion = new Date(createdAt);
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 14); // Rough 2-week estimate

    const userPrompt = `Generate an Extension of Time (EOT) notice for a ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**${clientInfo}**
**Job Created:** ${createdAt.toLocaleDateString("en-AU")}
**Estimated Original Completion:** ${estimatedCompletion.toLocaleDateString("en-AU")}
${businessName ? `**Contractor Business Name:** ${businessName}` : ""}
${abn ? `**ABN:** ${abn}` : ""}

Create a professional EOT notice that clearly explains the delay cause and requests a reasonable extension. Use Australian construction terminology and formatting.`;

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
        { error: "Failed to generate EOT notice" },
        { status: 500 }
      );
    }

    // Save document as draft (not confirmed)
    const { saveJob } = await import("@/lib/jobs");
    job.eotText = documentContent.trim();
    job.eotConfirmed = false;
    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        title: `Extension of Time Notice – ${job.title}`,
        body: documentContent.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating EOT:", error);
    return NextResponse.json(
      { error: "Failed to generate EOT notice. Please try again." },
      { status: 500 }
    );
  }
}

