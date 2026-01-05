import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

/**
 * POST /api/jobs/[id]/decline
 * Allows CLIENT users to decline a job quote
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

    // Only allow CLIENT role to decline quotes
    if (!isClient(user)) {
      return NextResponse.json(
        { error: "Only clients can decline quotes." },
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
        { error: "You can only decline quotes for jobs associated with your account." },
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

    // Update job in KV
    const now = new Date().toISOString();
    job.clientStatus = "declined";
    job.clientStatusUpdatedAt = now;
    job.clientDeclinedAt = now;
    // Set to pending_confirmation - tradie must manually confirm to move to "cancelled"
    job.jobStatus = "pending_confirmation";

    await saveJob(job);

    return NextResponse.json(
      {
        success: true,
        job: {
          id: job.id,
          clientStatus: job.clientStatus,
          clientDeclinedAt: job.clientDeclinedAt,
          jobStatus: job.jobStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error declining quote:", error);
    return NextResponse.json(
      { error: "Failed to decline quote. Please try again." },
      { status: 500 }
    );
  }
}

