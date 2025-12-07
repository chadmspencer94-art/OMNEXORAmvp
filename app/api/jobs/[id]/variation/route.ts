import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
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

    // Load business profile data
    let businessName = "";
    let abn = "";
    try {
      const { prisma } = await import("@/lib/prisma");
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          businessName: true,
          abn: true,
        },
      });
      if (prismaUser) {
        businessName = prismaUser.businessName || "";
        abn = prismaUser.abn || "";
      }
    } catch (error) {
      console.warn("Failed to load business profile:", error);
    }

    const systemPrompt = `You are an expert in Australian construction and trades contract administration. Generate a professional Variation / Change Order document.

The document must be structured clearly with the following sections:

1. **Job and Contractor Details**
   - Contractor business name and ABN (if available)
   - Job title and reference
   - Client name and property address
   - Date of variation

2. **Reference to Original Quote/Job**
   - Reference to the original job/quote
   - Original scope summary

3. **Description of Variation**
   - Clear description of the change in scope
   - What is being added, removed, or modified
   - Specific details of the variation work

4. **Reason for Variation**
   - Why the variation is required (client request, site conditions, etc.)
   - Brief justification

5. **Cost Impact**
   - Additional cost or credit amount
   - Breakdown if applicable
   - Note if amounts are placeholders that need to be filled in

6. **Time Impact**
   - Number of days extension or reduction
   - Impact on completion date

7. **Signature/Acceptance Section**
   - Lines for contractor signature, name, date
   - Lines for client signature, name, date
   - Acceptance acknowledgment

Format as clear, structured text with headings and bullet points. Use Australian terminology and context. Make it professional and suitable for client signing.`;

    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "";

    const userPrompt = `Generate a Variation / Change Order document for this ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
${clientInfo ? `**${clientInfo}**` : ""}
**Original Scope:** ${jobScope}

**Contractor Details:**
${businessName ? `Business Name: ${businessName}` : ""}
${abn ? `ABN: ${abn}` : ""}

Generate a complete variation document. If specific cost or time amounts are not provided, use clear placeholders (e.g., "[Amount to be determined]" or "[Days to be confirmed]") that the user can fill in.`;

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
        { error: "Failed to generate variation document" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        title: `Variation – ${job.title}`,
        body: content.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating variation:", error);
    return NextResponse.json(
      { error: "Failed to generate variation document. Please try again." },
      { status: 500 }
    );
  }
}

