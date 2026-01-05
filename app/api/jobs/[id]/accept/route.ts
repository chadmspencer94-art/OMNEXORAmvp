import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/jobs/[id]/accept
 * Allows CLIENT users to accept and sign a job quote
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

    // Only allow CLIENT role to accept quotes
    if (!isClient(user)) {
      return NextResponse.json(
        { error: "Only clients can accept quotes." },
        { status: 403 }
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

    // Verify that this user is the client for this job
    // Match by email (since jobs store clientEmail)
    if (job.clientEmail?.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You can only accept quotes for jobs associated with your account." },
        { status: 403 }
      );
    }

    // Check if job is already accepted or declined
    if (job.clientStatus === "accepted") {
      return NextResponse.json(
        { error: "This quote has already been accepted." },
        { status: 400 }
      );
    }

    if (job.clientStatus === "declined") {
      return NextResponse.json(
        { error: "This quote has already been declined." },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, signatureDataUrl } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Signature image is optional but preferred
    const signatureImage = signatureDataUrl && typeof signatureDataUrl === "string" 
      ? signatureDataUrl 
      : null;

    // Create signature record in Prisma
    const prisma = getPrisma();
    const signature = await prisma.signature.create({
      data: {
        userId: user.id,
        jobId: id,
        kind: "quote_acceptance",
        imageDataUrl: signatureImage || "", // Store empty string if no image
      },
    });

    // Update job in KV
    const now = new Date().toISOString();
    job.clientStatus = "accepted";
    job.clientStatusUpdatedAt = now;
    job.clientAcceptedAt = now;
    job.clientSignatureId = signature.id;
    job.clientSignedName = name.trim();
    job.clientSignedEmail = email.trim().toLowerCase();
    // Set to pending_confirmation - tradie must manually confirm to move to "booked"
    job.jobStatus = "pending_confirmation";
    
    // Mark AI pack as confirmed if not already
    if (job.aiReviewStatus !== "confirmed") {
      job.aiReviewStatus = "confirmed";
    }

    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        job: {
          id: job.id,
          clientStatus: job.clientStatus,
          clientAcceptedAt: job.clientAcceptedAt,
          clientSignedName: job.clientSignedName,
          clientSignedEmail: job.clientSignedEmail,
          jobStatus: job.jobStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting quote:", error);
    return NextResponse.json(
      { error: "Failed to accept quote. Please try again." },
      { status: 500 }
    );
  }
}

