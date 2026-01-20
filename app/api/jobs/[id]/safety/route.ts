import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { requireVerifiedEmail, requireVerifiedUser, UserNotVerifiedError } from "@/lib/authChecks";
import { hasPaidPlan } from "@/lib/planChecks";
import { getJobById } from "@/lib/jobs";
import { getPrisma, getSafeErrorMessage, isPrismaError } from "@/lib/prisma";

// User-friendly error messages for safety document operations
const SAFETY_ERROR_MESSAGES = {
  load: "Safety documents aren't available right now. Please try again shortly.",
  generate: "Unable to generate safety document right now. Please try again shortly.",
  save: "Unable to save safety document right now. Please try again shortly.",
};

/**
 * GET /api/jobs/[id]/safety
 * Get all safety documents for a job
 * Auth: tradie/business only, must own the job
 */
export async function GET(
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

    // Block clients from accessing safety documents
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Access denied. Safety documents are internal only." },
        { status: 403 }
      );
    }

    const { id: jobId } = await params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to view safety documents for this job." },
        { status: 403 }
      );
    }

    // Get all safety documents for this job
    const prisma = getPrisma();
    let documents;
    try {
      documents = await prisma.jobSafetyDocument.findMany({
        where: { jobId },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbError) {
      console.error("[safety] Database error fetching documents:", dbError);
      return NextResponse.json(
        { error: SAFETY_ERROR_MESSAGES.load },
        { status: 503 }
      );
    }

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error("Error fetching safety documents:", error);
    const safeMessage = isPrismaError(error) 
      ? SAFETY_ERROR_MESSAGES.load 
      : getSafeErrorMessage(error, SAFETY_ERROR_MESSAGES.load);
    return NextResponse.json(
      { error: safeMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/[id]/safety/generate
 * Generate a safety document (SWMS, Risk Assessment, or Toolbox Talk)
 * Auth: tradie/business only, must own the job
 * 
 * PAID PLAN GATE: Safety documentation is locked until paid plan (admin override allowed).
 * VERIFICATION GATE: Requires business verification before generating documents.
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

    // Block clients from generating safety documents
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Access denied. Safety document generation is available to trades and businesses only." },
        { status: 403 }
      );
    }

    // PAID PLAN GATE: Safety documentation is locked until paid plan (admin override allowed)
    if (!hasPaidPlan(user)) {
      return NextResponse.json(
        { 
          error: "Safety documentation requires a paid plan. Upgrade your plan to access SWMS, Risk Assessments, and Toolbox Talks.",
          code: "PAID_PLAN_REQUIRED" 
        },
        { status: 403 }
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

    // Require verified email for safety document generation
    try {
      await requireVerifiedEmail(user);
    } catch (error) {
      return NextResponse.json(
        { error: "Email verification required. Please verify your email address to generate safety documents." },
        { status: 403 }
      );
    }

    const { id: jobId } = await params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to generate safety documents for this job." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !["SWMS", "RISK_ASSESSMENT", "TOOLBOX_TALK"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid document type. Must be SWMS, RISK_ASSESSMENT, or TOOLBOX_TALK" },
        { status: 400 }
      );
    }

    // Load user business profile from Prisma
    let userPrimaryTrade: string | null = null;
    let userTradeTypes: string | null = null;
    let businessName: string | null = null;
    const workTypes: string[] = [];

    const prisma = getPrisma();
    try {
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          primaryTrade: true,
          tradeTypes: true,
          businessName: true,
          tradingName: true,
          doesResidential: true,
          doesCommercial: true,
          doesStrata: true,
        },
      });

      if (prismaUser) {
        userPrimaryTrade = prismaUser.primaryTrade || null;
        userTradeTypes = prismaUser.tradeTypes || null;
        businessName = prismaUser.businessName || prismaUser.tradingName || null;
        
        if (prismaUser.doesResidential) workTypes.push("residential");
        if (prismaUser.doesCommercial) workTypes.push("commercial");
        if (prismaUser.doesStrata) workTypes.push("strata");
      }
    } catch (error) {
      console.warn("Failed to load Prisma user for safety document:", error);
    }

    const tradeType = userPrimaryTrade || job.tradeType;
    const tradeTypes = userTradeTypes ? userTradeTypes.split(",").map(t => t.trim()).join(", ") : null;
    const workTypeContext = workTypes.length > 0 ? workTypes.join(", ") : (job.propertyType || "residential");

    // Generate content using OpenAI
    const { openai } = await import("@/lib/openai");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "SWMS") {
      systemPrompt = `You are an expert safety consultant specialising in Australian construction and trades work safety compliance. You create comprehensive Safe Work Method Statements (SWMS) that comply with Australian Work Health and Safety (WHS) regulations.

Your SWMS documents must be:
- Clear, structured, and professional
- Compliant with Australian WHS standards
- Specific to the trade and work type described
- Practical and actionable for tradies on site
- Well-formatted with clear headings and sections

Format your response as structured text with clear sections using headings and bullet points.`;

      userPrompt = `Generate a comprehensive Safe Work Method Statement (SWMS) for this ${tradeType.toLowerCase()} job:

**Job Title:** ${job.title}
**Trade Type:** ${tradeType}${tradeTypes ? ` (Specialisations: ${tradeTypes})` : ""}
**Work Type:** ${workTypeContext}
**Property Type:** ${job.propertyType}
**Location:** ${job.address || "Western Australia"}

${job.aiScopeOfWork ? `**Scope of Work:**\n${job.aiScopeOfWork}` : ""}

${job.notes ? `**Additional Job Details:**\n${job.notes}` : ""}

Create a complete SWMS document with the following sections:

1. **Scope of Works**
   - Clear description of the work to be performed
   - Location and site details
   - Duration and timing considerations

2. **Key Hazards**
   - List all identified hazards relevant to this trade and work type
   - Include physical, chemical, environmental, and ergonomic hazards
   - Be specific to the work described

3. **Risk Controls**
   - For each hazard, specify control measures
   - Include engineering controls, administrative controls, and PPE
   - Reference Australian standards where relevant

4. **Personal Protective Equipment (PPE) Required**
   - List all required PPE items
   - Specify when and where each item must be worn
   - Include any special requirements

5. **Step-by-Step Work Process**
   - Detailed sequence of work steps
   - Include safety controls embedded in each step
   - Reference hazards and controls from earlier sections

6. **Emergency Procedures**
   - First aid procedures
   - Emergency contact information
   - Incident reporting requirements
   - Evacuation procedures if applicable

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it professional and suitable for site use.`;
    } else if (type === "RISK_ASSESSMENT") {
      systemPrompt = `You are an expert in Australian workplace health and safety (WHS) risk assessment for the construction and trades industry. You create comprehensive risk assessment documents that comply with Australian WHS standards.

Your risk assessments must be:
- Clear and structured
- Compliant with Australian WHS standards
- Specific to the trade and work type
- Practical and actionable
- Well-formatted with clear sections

Format your response as structured text with clear sections using headings and bullet points.`;

      userPrompt = `Generate a comprehensive Risk Assessment for this ${tradeType.toLowerCase()} job:

**Job Title:** ${job.title}
**Trade Type:** ${tradeType}${tradeTypes ? ` (Specialisations: ${tradeTypes})` : ""}
**Work Type:** ${workTypeContext}
**Property Type:** ${job.propertyType}
**Location:** ${job.address || "Western Australia"}

${job.aiScopeOfWork ? `**Scope of Work:**\n${job.aiScopeOfWork}` : ""}

${job.notes ? `**Additional Job Details:**\n${job.notes}` : ""}

Create a complete Risk Assessment document with the following sections:

1. **Hazard Identification**
   - List all potential hazards relevant to this trade and work type
   - Include physical, chemical, environmental, and ergonomic hazards
   - Be specific to the work described

2. **Risk Rating (Before Controls)**
   - For each hazard, assess the risk level (Low/Medium/High)
   - Consider likelihood and consequence
   - Use standard risk matrix terminology

3. **Control Measures**
   - For each hazard, specify control measures
   - Include engineering controls, administrative controls, and PPE
   - Reference Australian standards where relevant

4. **Residual Risk**
   - After controls are applied, reassess the risk level
   - Document the residual risk rating
   - Note any remaining risks that require ongoing monitoring

5. **Review and Monitoring**
   - Specify when this risk assessment should be reviewed
   - Note any conditions that would trigger an immediate review

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it professional and suitable for site use.`;
    } else if (type === "TOOLBOX_TALK") {
      systemPrompt = `You are an expert in Australian workplace health and safety (WHS) for the construction and trades industry. You create comprehensive toolbox talk outlines that help tradies conduct effective safety briefings.

Your toolbox talks must be:
- Clear and engaging
- Specific to the trade and work type
- Practical and actionable
- Well-formatted with clear sections
- Suitable for on-site briefings

Format your response as structured text with clear sections using headings and bullet points.`;

      userPrompt = `Generate a comprehensive Toolbox Talk outline for this ${tradeType.toLowerCase()} job:

**Job Title:** ${job.title}
**Trade Type:** ${tradeType}${tradeTypes ? ` (Specialisations: ${tradeTypes})` : ""}
**Work Type:** ${workTypeContext}
**Property Type:** ${job.propertyType}
**Location:** ${job.address || "Western Australia"}

${job.aiScopeOfWork ? `**Scope of Work:**\n${job.aiScopeOfWork}` : ""}

${job.notes ? `**Additional Job Details:**\n${job.notes}` : ""}

Create a complete Toolbox Talk outline with the following sections:

1. **Topic Summary**
   - Brief overview of the work to be discussed
   - Key safety focus areas

2. **Key Points to Cover**
   - Main safety topics to discuss
   - Specific hazards and controls relevant to this job
   - PPE requirements
   - Emergency procedures

3. **Attendance Section**
   - Template text for recording attendance
   - Note that signatures will be collected on site

4. **Discussion Questions**
   - Questions to engage the team
   - Points to confirm understanding

5. **Action Items**
   - Any specific actions required before work begins
   - Equipment checks or setup requirements

Format the response as clear, structured text with section headings. Use bullet points and numbered lists where appropriate. Make it professional and suitable for on-site briefings.`;
    }

    console.log(`[jobs] generating safety document type ${type} for job ${jobId}`);
    
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
    } catch (openaiError: any) {
      console.error("[jobs] OpenAI API error generating safety document:", openaiError);
      if (openaiError?.message?.includes("API key") || openaiError?.code === "invalid_api_key") {
        throw new Error("OpenAI API key is not configured. Please contact support.");
      }
      throw new Error(`Failed to generate safety document: ${openaiError?.message || "Unknown error"}`);
    }

    const content = completion.choices[0]?.message?.content || "";
    if (!content) {
      throw new Error("Failed to generate safety document content");
    }

    // Determine title based on type
    const title = type === "SWMS" 
      ? "Safe Work Method Statement (SWMS)"
      : type === "RISK_ASSESSMENT"
      ? "Risk Assessment"
      : "Toolbox Talk Outline";

    // Check if document already exists for this job + type and save to database
    let document;
    try {
      const existing = await prisma.jobSafetyDocument.findFirst({
        where: { jobId, type },
      });

      if (existing) {
        // Update existing document
        document = await prisma.jobSafetyDocument.update({
          where: { id: existing.id },
          data: {
            title,
            content,
            status: "generated",
          },
        });
      } else {
        // Create new document
        document = await prisma.jobSafetyDocument.create({
          data: {
            jobId,
            type,
            title,
            content,
            status: "generated",
          },
        });
      }
    } catch (dbError) {
      console.error("[safety] Database error saving document:", dbError);
      return NextResponse.json(
        { error: SAFETY_ERROR_MESSAGES.save },
        { status: 503 }
      );
    }

    console.log(`[jobs] successfully generated safety document ${document.id} for job ${jobId}`);
    return NextResponse.json({ document }, { status: 200 });
  } catch (error: unknown) {
    console.error("[jobs] error generating safety document:", error);
    
    // Check if it's a Prisma/database error - return friendly message
    if (isPrismaError(error)) {
      return NextResponse.json(
        { error: SAFETY_ERROR_MESSAGES.generate },
        { status: 503 }
      );
    }
    
    // Check if it's an OpenAI API key error
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("API key") || errorMessage.includes("OpenAI")) {
      return NextResponse.json(
        { error: "AI service is not configured. Please ensure OPENAI_API_KEY is set in environment variables." },
        { status: 503 }
      );
    }
    
    // Return a safe error message (filters out sensitive info)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, SAFETY_ERROR_MESSAGES.generate) },
      { status: 500 }
    );
  }
}

