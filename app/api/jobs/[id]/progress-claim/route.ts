import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { openai } from "@/lib/openai";
import { calculateEstimateRange } from "@/lib/pricing";

/**
 * POST /api/jobs/[id]/progress-claim
 * Generates a Progress Claim / Tax Invoice for the specified job
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
    let businessAddress = "";
    try {
      const { prisma } = await import("@/lib/prisma");
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          businessName: true,
          abn: true,
          serviceArea: true,
        },
      });
      if (prismaUser) {
        businessName = prismaUser.businessName || "";
        abn = prismaUser.abn || "";
        businessAddress = prismaUser.serviceArea || "";
      }
    } catch (error) {
      console.warn("Failed to load business profile:", error);
    }

    // Get pricing estimate if available
    let pricingInfo = "";
    if (job.aiQuote) {
      const estimateRange = calculateEstimateRange(job.aiQuote);
      if (estimateRange.formattedRange && estimateRange.formattedRange !== "N/A") {
        pricingInfo = `\n**Estimated Total:** ${estimateRange.formattedRange}`;
      }
    }

    const systemPrompt = `You are an expert in Australian construction and trades invoicing and progress claims. Generate a professional Progress Claim / Tax Invoice document.

The document must be structured clearly with the following sections:

1. **Contractor Details**
   - Business name
   - ABN (if available)
   - Contact details (address, phone, email - use placeholders if not provided)
   - Bank account details (use placeholder if not provided)

2. **Client Details**
   - Client name
   - Client email/address (if available)

3. **Invoice/Claim Details**
   - Job reference
   - Claim number (e.g., "Progress Claim 1" or "Tax Invoice #001")
   - Invoice date
   - Due date (based on payment terms)

4. **Claim Summary Table** (as formatted text, not a real table)
   - Contract / Estimated value
   - Previous claims total
   - This claim amount
   - Balance to complete
   - Use clear labels and formatting

5. **Payment Terms**
   - Payment terms (e.g., 7 days, 14 days, or as agreed)
   - Payment method (bank transfer, etc.)
   - Include bank details placeholder if not provided

6. **Description of Work**
   - Brief description of work completed or claimed
   - Reference to job scope

Use any pricing data provided. Where amounts are missing, generate clearly labelled placeholders (e.g., "[Contract Value: $X,XXX]" or "[This Claim: $XXX]") that the user can edit.

Format as clear, structured text with headings and sections. Use Australian terminology and context. Make it professional and suitable for client invoicing.`;

    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const jobScope = job.aiScopeOfWork || job.notes || job.title || "general tasks";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "";

    const userPrompt = `Generate a Progress Claim / Tax Invoice for this ${tradeInfo} job.

**Job Title:** ${job.title}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
${clientInfo ? `**${clientInfo}**` : ""}
**Job Scope:** ${jobScope}${pricingInfo}

**Contractor Details:**
${businessName ? `Business Name: ${businessName}` : ""}
${abn ? `ABN: ${abn}` : ""}
${businessAddress ? `Address: ${businessAddress}` : ""}

Generate a complete progress claim/invoice. Use placeholders for amounts and bank details that need to be filled in.`;

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
        { error: "Failed to generate progress claim" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        title: `Progress Claim / Tax Invoice – ${job.title}`,
        body: content.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating progress claim:", error);
    return NextResponse.json(
      { error: "Failed to generate progress claim. Please try again." },
      { status: 500 }
    );
  }
}

