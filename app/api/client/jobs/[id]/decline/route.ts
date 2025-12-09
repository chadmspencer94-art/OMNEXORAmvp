import { NextRequest, NextResponse } from "next/server";
import { requireClientUser } from "@/lib/auth";
import { getJobById, saveJob, type ClientStatus } from "@/lib/jobs";

/**
 * POST /api/client/jobs/[id]/decline
 * Allows a client to decline a job pack
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
        { error: "Not authorized to decline this job" },
        { status: 403 }
      );
    }

    // Check current status - only allow decline if status is "sent" or "draft"
    const currentStatus: ClientStatus = (job.clientStatus || "draft") as ClientStatus;
    if (currentStatus === "declined") {
      return NextResponse.json(
        { error: "This job pack has already been declined" },
        { status: 400 }
      );
    }

    if (currentStatus === "accepted") {
      return NextResponse.json(
        { error: "Cannot decline a job pack that has already been accepted" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const declineReason = body.reason?.trim() || null;

    // Update job status
    const now = new Date().toISOString();
    job.clientStatus = "declined";
    job.clientDeclinedAt = now;
    job.clientStatusUpdatedAt = now;

    // Store decline reason if provided (we can add a field for this if needed)
    // For now, we'll just update the status

    // Save job
    await saveJob(job);

    // Optionally update job workflow status to "cancelled" if it makes sense
    if (!job.jobStatus || job.jobStatus === "pending") {
      job.jobStatus = "cancelled";
      await saveJob(job);
    }

    return NextResponse.json({
      success: true,
      clientStatus: job.clientStatus,
      clientDeclinedAt: job.clientDeclinedAt,
    });
  } catch (error) {
    console.error("Error declining job pack:", error);
    return NextResponse.json(
      { error: "Failed to decline job pack" },
      { status: 500 }
    );
  }
}

