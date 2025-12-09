import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { sendJobPackEmail, buildJobPackEmailHtml, buildJobPackEmailText } from "@/lib/email";
import { ensureQuoteNumber, getNextQuoteVersion } from "@/lib/quotes";
import { prisma } from "@/lib/prisma";

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

    // Email verification check: require verified email
    try {
      const { requireVerifiedEmail } = await import("@/lib/authChecks");
      await requireVerifiedEmail(user);
    } catch (error: any) {
      if (error.name === "EmailNotVerifiedError") {
        return NextResponse.json(
          {
            error: "EMAIL_NOT_VERIFIED",
            message: "Please verify your email before sending job packs to clients.",
          },
          { status: 403 }
        );
      }
      throw error;
    }

    // Business verification check: only verified tradies can send emails to clients
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

    // Generate quote number and version before sending
    const quoteNumber = await ensureQuoteNumber(job.id);
    const nextVersion = await getNextQuoteVersion(job.id);

    // Determine expiry date (MVP: 30 days from now)
    const expiryDays = 30; // TODO: make configurable per user later
    const quoteExpiryAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    // Build email subject (include quote number and version)
    const emailSubject = subject?.trim() || `Job pack for ${job.title} - ${quoteNumber} v${nextVersion}`;

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

    // Format expiry date for email
    const expiryDateFormatted = quoteExpiryAt.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

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
      quoteNumber,
      quoteVersion: nextVersion,
      quoteExpiryAt: expiryDateFormatted,
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

    // Create quote version snapshot before updating job
    try {
      await (prisma as any).jobQuoteVersion.create({
        data: {
          jobId: job.id,
          version: nextVersion,
          sentAt: new Date(),
          quoteExpiryAt,
          labourHoursEstimate: job.labourHoursEstimate,
          labourSubtotal: job.labourSubtotal != null ? job.labourSubtotal : null,
          materialsTotal: job.materialsTotal != null ? job.materialsTotal : null,
          subtotal: job.subtotal != null ? job.subtotal : null,
          gstAmount: job.gstAmount != null ? job.gstAmount : null,
          totalInclGst: job.totalInclGst != null ? job.totalInclGst : null,
          summary: job.aiSummary || null,
          scopeOfWork: job.aiScopeOfWork || null,
          inclusions: job.aiInclusions || null,
          exclusions: job.aiExclusions || null,
          materialsText: job.materialsOverrideText || job.aiMaterials || null,
          clientNotes: job.aiClientNotes || null,
        },
      });
    } catch (error) {
      console.error("Failed to create quote version snapshot:", error);
      // Don't fail the send if snapshot creation fails, but log it
    }

    // Email sent successfully - update job with sent timestamp, quote metadata, and client status
    const now = new Date().toISOString();
    job.sentToClientAt = now;
    job.quoteNumber = quoteNumber;
    job.quoteVersion = nextVersion;
    job.quoteExpiryAt = quoteExpiryAt.toISOString();
    job.quoteLastSentAt = now;
    
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

