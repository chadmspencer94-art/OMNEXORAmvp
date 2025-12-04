import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob, type JobWorkflowStatus, type AIReviewStatus } from "@/lib/jobs";

const VALID_JOB_STATUSES: JobWorkflowStatus[] = ["pending", "booked", "completed", "cancelled"];
const VALID_AI_REVIEW_STATUSES: AIReviewStatus[] = ["pending", "confirmed"];

/**
 * PATCH /api/jobs/[id]/status - Update job workflow status or AI review status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    let updated = false;

    // Update job workflow status if provided
    if (body.jobStatus !== undefined) {
      if (!VALID_JOB_STATUSES.includes(body.jobStatus)) {
        return NextResponse.json(
          { error: "Invalid job status. Must be one of: pending, booked, completed, cancelled" },
          { status: 400 }
        );
      }
      job.jobStatus = body.jobStatus;
      updated = true;
    }

    // Update AI review status if provided
    if (body.aiReviewStatus !== undefined) {
      if (!VALID_AI_REVIEW_STATUSES.includes(body.aiReviewStatus)) {
        return NextResponse.json(
          { error: "Invalid AI review status. Must be one of: pending, confirmed" },
          { status: 400 }
        );
      }
      job.aiReviewStatus = body.aiReviewStatus;
      updated = true;
    }

    if (!updated) {
      return NextResponse.json(
        { error: "No valid status fields provided" },
        { status: 400 }
      );
    }

    await saveJob(job);

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error updating job status:", error);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}

