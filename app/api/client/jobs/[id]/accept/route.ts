import { NextRequest, NextResponse } from "next/server";
import { requireClientUser } from "@/lib/auth";
import { getJobById, saveJob, type ClientStatus } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/client/jobs/[id]/accept
 * Allows a client to accept a job pack
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireClientUser();
    const { id } = await context.params;

    // Load the job
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Ensure this job belongs to this client
    const normalizedClientEmail = user.email.toLowerCase().trim();
    const jobClientEmail = job.clientEmail?.toLowerCase().trim();

    if (jobClientEmail !== normalizedClientEmail) {
      return NextResponse.json(
        { error: "Not authorized to accept this job" },
        { status: 403 }
      );
    }

    // Check current status - only allow accept if status is "sent" or "draft"
    const currentStatus: ClientStatus = (job.clientStatus || "draft") as ClientStatus;
    // Guard rails
    if (currentStatus === "accepted") {
      return NextResponse.json(
        { error: "This job pack has already been accepted" },
        { status: 400 }
      );
    }

    if (currentStatus === "declined" || currentStatus === "cancelled") {
      return NextResponse.json(
        { 
          error: "QUOTE_DECLINED",
          message: "This job pack was declined; contact your tradie for a new quote." 
        },
        { status: 400 }
      );
    }

    // Check expiry
    if (job.quoteExpiryAt) {
      const expiryDate = new Date(job.quoteExpiryAt);
      const now = new Date();
      if (now > expiryDate) {
        return NextResponse.json(
          { 
            error: "QUOTE_EXPIRED",
            message: "This quote has expired. Please contact your tradie to get an updated job pack." 
          },
          { status: 400 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { fullName, note, confirm } = body;

    // Validate payload
    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      return NextResponse.json(
        { error: "Full name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    if (confirm !== true) {
      return NextResponse.json(
        { error: "You must confirm your agreement to proceed" },
        { status: 400 }
      );
    }

    // Persist acceptance - tie to current quote version
    const now = new Date().toISOString();
    const acceptedQuoteVersion = job.quoteVersion ?? 1; // Default to version 1 if not set
    
    job.clientStatus = "accepted";
    job.clientAcceptedAt = now;
    job.clientSignedName = fullName.trim();
    job.clientSignedEmail = user.email;
    job.clientAcceptedByName = fullName.trim(); // Store typed name
    job.clientAcceptanceNote = (note && typeof note === "string" && note.trim()) ? note.trim() : null;
    job.clientAcceptedQuoteVer = acceptedQuoteVersion; // Store which version was accepted
    job.clientStatusUpdatedAt = now;

    // If there's a signature data URL, store it in Prisma Signature model
    if (body.signatureDataUrl && typeof body.signatureDataUrl === "string") {
      try {
        const prisma = getPrisma();
        const signature = await prisma.signature.create({
          data: {
            userId: user.id,
            jobId: job.id,
            kind: "quote_acceptance",
            imageDataUrl: body.signatureDataUrl,
          },
        });
        job.clientSignatureId = signature.id;
      } catch (error) {
        console.error("Error saving signature:", error);
        // Continue without signature if save fails
      }
    }

    // Save job
    await saveJob(job);

    // Optionally update job workflow status to "booked" if it makes sense
    if (!job.jobStatus || job.jobStatus === "pending") {
      job.jobStatus = "booked";
      await saveJob(job);
    }

    return NextResponse.json({
      success: true,
      clientStatus: job.clientStatus,
      clientAcceptedAt: job.clientAcceptedAt,
    });
  } catch (error) {
    console.error("Error accepting job pack:", error);
    return NextResponse.json(
      { error: "Failed to accept job pack" },
      { status: 500 }
    );
  }
}

