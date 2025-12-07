import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
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

    const systemPrompt = `You are an expert in Australian construction and trades project completion and handover. Generate a professional Handover & Practical Completion checklist.

The document must be structured clearly with the following sections:

1. **Job Details**
   - Project name/title
   - Property address
   - Client name
   - Date of practical completion

2. **Statement of Practical Completion**
   - Statement that works are practically complete subject to minor defects
   - Note that the works are substantially complete and ready for use

3. **Completion Checklist** (comprehensive list with checkboxes as text)
   Include items relevant to the trade type, such as:
   - All areas completed as per scope
   - Surfaces cleaned and prepared
   - Rubbish and materials removed
   - Site left clean and tidy
   - Client walkthrough completed
   - Touch-ups completed (if applicable)
   - Keys/fobs returned (if applicable)
   - Any trade-specific completion items

4. **Defects/Outstanding Items** (if any)
   - List any minor defects or items to be completed
   - Note that these do not prevent practical completion

5. **Client Comments Section**
   - Space for client to note any observations or comments

6. **Practical Completion Date**
   - Date field for practical completion

7. **Signature Lines**
   - Contractor signature, name, date
   - Client signature, name, date

Format as clear, structured text with headings and a checklist format. Use Australian terminology and context. Make it professional and suitable for client signing.`;

    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "";

    const userPrompt = `Generate a Handover & Practical Completion checklist for this ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
${clientInfo ? `**${clientInfo}**` : ""}
**Job Scope:** ${jobScope}

**Contractor Details:**
${businessName ? `Business Name: ${businessName}` : ""}

Generate a complete handover checklist. Include trade-specific completion items relevant to ${tradeInfo} work.`;

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
        { error: "Failed to generate handover checklist" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        title: `Handover & Practical Completion – ${job.title}`,
        body: content.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating handover:", error);
    return NextResponse.json(
      { error: "Failed to generate handover checklist. Please try again." },
      { status: 500 }
    );
  }
}

