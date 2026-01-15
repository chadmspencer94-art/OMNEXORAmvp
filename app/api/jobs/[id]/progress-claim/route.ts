import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, isClient } from "@/lib/auth";
import { requireVerifiedUser, UserNotVerifiedError } from "@/lib/authChecks";
import { getJobById, saveJob } from "@/lib/jobs";
import { openai, isOpenAIAvailable } from "@/lib/openai";

/**
 * POST /api/jobs/[id]/progress-claim
 * Generates a Progress Claim / Tax Invoice for the specified job
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
    let abn = "";
    let businessAddress = "";
    try {
      const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
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
    } catch {
      // Continue without business profile data
    }

    // Build Progress Claim prompt
    const systemPrompt = `You are an expert in Australian construction and trades invoicing and contract administration. Your task is to generate a professional Progress Claim / Tax Invoice document for a specific job.

The Progress Claim document must be structured clearly with the following sections:

1. **Contractor Details**
   - Business name
   - ABN (if available)
   - Contact details (email, phone if available)
   - Business address (if available)
   - Bank details section (use placeholder if not available)

2. **Client Details**
   - Client name
   - Client email
   - Property address

3. **Job Reference**
   - Job title
   - Job reference/ID
   - Invoice/Claim number (e.g., "Progress Claim 1" or "Invoice #001")

4. **Claim Summary Table (as formatted text)**
   Create a clear table showing:
   - Contract / Estimated Value: [amount]
   - Previous Claims Total: [amount or $0.00]
   - This Claim Amount: [amount]
   - Balance to Complete: [amount]
   - Include GST breakdown if applicable

5. **Payment Terms**
   - Payment terms (e.g., "Payment due within 14 days" or "7 days EOM")
   - Payment method (e.g., "Bank transfer to account details below")
   - Include bank account details section (use placeholders if not available)

6. **Work Description**
   - Brief description of work completed or progress made
   - Reference to original scope

Format the response as clear, structured text with section headings. Use formatted text tables (using dashes, pipes, or spacing) for the claim summary. Make it professional and suitable for Australian tax invoice requirements. Include placeholders clearly marked (e.g., "[Amount to be confirmed]") where exact figures are not available.`;

    // Build user prompt with job details
    const tradeInfo = job.tradeType || "general trade";
    const propertyInfo = job.propertyType || "property";
    const location = job.address || "Western Australia";
    const clientInfo = job.clientName ? `Client: ${job.clientName}${job.clientEmail ? ` (${job.clientEmail})` : ""}` : "Client details not specified";
    
    // Get pricing info if available
    let pricingInfo = "";
    let estimatedTotal = "";
    if (job.aiQuote) {
      try {
        const quote = JSON.parse(job.aiQuote);
        if (quote.totalEstimate?.totalJobEstimate) {
          estimatedTotal = quote.totalEstimate.totalJobEstimate;
          pricingInfo = `\n\nOriginal quote estimate: ${estimatedTotal}`;
        }
      } catch {
        // Ignore parse errors
      }
    }

    const userPrompt = `Generate a Progress Claim / Tax Invoice for a ${tradeInfo} job.

**Job Title:** ${job.title}
**Job ID/Reference:** ${job.id.slice(0, 8)}
**Trade Type:** ${tradeInfo}
**Property Type:** ${propertyInfo}
**Location:** ${location}
**${clientInfo}**
${pricingInfo}
${businessName ? `**Contractor Business Name:** ${businessName}` : ""}
${abn ? `**ABN:** ${abn}` : ""}
${businessAddress ? `**Business Address:** ${businessAddress}` : ""}
**Contractor Email:** ${user.email}

Create a professional Progress Claim / Tax Invoice that includes all required sections. Use placeholders for amounts and bank details if not available. Use Australian tax invoice formatting and terminology.`;

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
          { error: "Failed to generate Progress Claim. No content received from AI service." },
          { status: 500 }
        );
      }
    } catch (openaiError: any) {
      console.error("[progress-claim] OpenAI API error:", openaiError);
      if (openaiError?.message?.includes("API key") || openaiError?.code === "invalid_api_key") {
        return NextResponse.json(
          { error: "AI service is not available. Please contact support." },
          { status: 503 }
        );
      }
      throw openaiError; // Re-throw to be caught by outer catch
    }

    // Save document as draft (not confirmed)
    job.progressClaimText = documentContent.trim();
    job.progressClaimConfirmed = false;
    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        title: `Progress Claim / Tax Invoice – ${job.title}`,
        body: documentContent.trim(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[progress-claim] Error generating Progress Claim:", error);
    
    // If it's already a handled OpenAI error, return it
    if (error?.message && (error.message.includes("AI service") || error.message.includes("API key"))) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    
    // Generic error fallback
    return NextResponse.json(
      { error: error?.message || "Failed to generate Progress Claim. Please try again." },
      { status: 500 }
    );
  }
}

