import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { sendJobPackEmail, buildJobPackEmailHtml, buildJobPackEmailText } from "@/lib/email";

interface SendToClientRequestBody {
  clientEmail: string;
  subject?: string;
  message?: string;
}

interface TotalEstimateQuote {
  description?: string;
  totalJobEstimate?: string;
}

interface ParsedQuote {
  totalEstimate?: TotalEstimateQuote;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Load job
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Authorization: ensure user owns this job
    if (job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this job" },
        { status: 403 }
      );
    }

    // Verification check: only verified tradies can send emails to clients
    if (user.verificationStatus !== "verified") {
      return NextResponse.json(
        { 
          error: "Your business must be verified before you can send job packs to clients. Please complete business verification first.",
          code: "VERIFICATION_REQUIRED"
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as SendToClientRequestBody;
    const { clientEmail, subject, message } = body;

    // Validate client email
    if (!clientEmail || typeof clientEmail !== "string" || !clientEmail.trim()) {
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Build email subject
    const emailSubject = subject?.trim() || `Job pack for ${job.title}`;

    // Parse quote to get price range
    let priceRange = "";
    if (job.aiQuote) {
      try {
        const quote: ParsedQuote = JSON.parse(job.aiQuote);
        if (quote.totalEstimate?.totalJobEstimate) {
          priceRange = quote.totalEstimate.totalJobEstimate;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Common email content options
    const emailContentOptions = {
      clientName: job.clientName,
      title: job.title,
      address: job.address,
      summary: job.aiSummary,
      scopeOfWork: job.aiScopeOfWork,
      inclusions: job.aiInclusions,
      exclusions: job.aiExclusions,
      priceRange,
      clientNotes: job.aiClientNotes,
      aiMaterials: job.aiMaterials,
      materialsOverrideText: job.materialsOverrideText,
      materialsAreRoughEstimate: job.materialsAreRoughEstimate,
      customMessage: message?.trim(),
    };

    // Build email HTML content
    const emailHtml = buildJobPackEmailHtml(emailContentOptions);

    // Build plain-text version
    const emailText = buildJobPackEmailText(emailContentOptions);

    // Send the email via Resend
    const emailResult = await sendJobPackEmail({
      jobId: id,
      to: clientEmail.trim(),
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    // Check if email send failed
    if (!emailResult.success) {
      console.error(`[JOB] Email send FAILED for job ${job.id} to ${clientEmail.trim()}`);
      return NextResponse.json(
        { 
          error: "Email failed to send. Please try again or contact support.",
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    // Email sent successfully - update job with sent timestamp and client status
    const now = new Date().toISOString();
    job.sentToClientAt = now;
    
    // Only auto-update to "sent" if still in "draft" status
    // Don't override "accepted", "declined", etc. on resends
    if (!job.clientStatus || job.clientStatus === "draft") {
      job.clientStatus = "sent";
      job.clientStatusUpdatedAt = now;
    }
    
    await saveJob(job);

    // Log the successful send action
    console.log(`[JOB] Job pack SENT for job ${job.id} to ${clientEmail.trim()} by user ${user.email}`);

    return NextResponse.json({
      success: true,
      sentToClientAt: job.sentToClientAt,
      clientStatus: job.clientStatus,
      clientStatusUpdatedAt: job.clientStatusUpdatedAt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending job pack to client:", errorMessage);
    console.error("Full error:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

