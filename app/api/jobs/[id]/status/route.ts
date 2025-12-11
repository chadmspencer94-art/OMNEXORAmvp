import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById, saveJob, type JobWorkflowStatus, type AIReviewStatus } from "@/lib/jobs";

/**
 * PATCH /api/jobs/[id]/status
 * Update job workflow status or AI review status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    // Check ownership - user must own the job or be an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { jobStatus, aiReviewStatus } = body;

    // Update job workflow status if provided
    if (jobStatus) {
      const validStatuses: JobWorkflowStatus[] = ["pending", "booked", "completed", "cancelled"];
      if (!validStatuses.includes(jobStatus)) {
        return NextResponse.json(
          { error: "Invalid job status" },
          { status: 400 }
        );
      }
      job.jobStatus = jobStatus;
    }

    // Update AI review status if provided
    if (aiReviewStatus) {
      const validAIStatuses: AIReviewStatus[] = ["pending", "confirmed"];
      if (!validAIStatuses.includes(aiReviewStatus)) {
        return NextResponse.json(
          { error: "Invalid AI review status" },
          { status: 400 }
        );
      }
      job.aiReviewStatus = aiReviewStatus;
    }

    // Save the updated job
    await saveJob(job);

    return NextResponse.json({ 
      success: true,
      job: {
        id: job.id,
        jobStatus: job.jobStatus,
        aiReviewStatus: job.aiReviewStatus,
      }
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

