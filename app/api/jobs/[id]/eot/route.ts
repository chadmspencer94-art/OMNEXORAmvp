import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
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
    try {
      const { prisma } = await import("@/lib/prisma");
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          businessName: true,
        },
      });
      if (prismaUser) {
        businessName = prismaUser.businessName || "";
      }
    } catch (error) {
      console.warn("Failed to load business profile:", error);
    }

    const systemPrompt = `You are an expert in Australian construction and trades contract administration. Generate a professional Extension of Time (EOT) notice.

The document must be structured clearly with the following sections:

1. **Job and Contractor Details**
   - Contractor business name (if available)
   - Job title and reference
   - Client name and property address
   - Date of EOT notice

2. **Cause of Delay**
   - Clear description of the cause(s) of delay
   - Examples: weather conditions, client delays, access issues, supplier delays, unforeseen site conditions
   - Be specific and factual

3. **Period of Extension Requested**
   - Number of days extension requested
   - Note if this is to be confirmed

4. **Indicative Revised Completion Date**
   - Proposed new completion date (clearly marked as indicative)
   - Note that this is subject to confirmation

5. **Statement**
   - Reference to fair and reasonable adjustment to program
   - Acknowledgment that this is a formal EOT request

6. **Signature Section**
   - Lines for contractor signature, name, date
   - Lines for client signature, name, date (if required)

Format as clear, structured text with headings and bullet points. Use Australian terminology and context. Make it professional and suitable for client communication.`;

    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "";

    const userPrompt = `Generate an Extension of Time (EOT) notice for this ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
${clientInfo ? `**${clientInfo}**` : ""}
**Job Scope:** ${jobScope}

**Contractor Details:**
${businessName ? `Business Name: ${businessName}` : ""}

Generate a complete EOT notice. If specific days or dates are not provided, use clear placeholders (e.g., "[Days to be confirmed]" or "[Date to be determined]") that the user can fill in.`;

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
        { error: "Failed to generate EOT notice" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        title: `Extension of Time Notice – ${job.title}`,
        body: content.trim(),
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

