import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only non-client users can update job schedules
    if (isClient(currentUser)) {
      return NextResponse.json(
        { error: "Clients cannot update job schedules" },
        { status: 403 }
      );
    }

    const { id: jobId } = await params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Ensure the current user owns the job
    if (job.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Not authorized to update this job" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { scheduledStartAt, scheduledEndAt, scheduleNotes } = body;

    // Parse and validate dates
    let parsedStartAt: Date | null = null;
    let parsedEndAt: Date | null = null;

    if (scheduledStartAt !== null && scheduledStartAt !== undefined) {
      if (typeof scheduledStartAt !== "string") {
        return NextResponse.json(
          { error: "scheduledStartAt must be an ISO string or null" },
          { status: 400 }
        );
      }
      parsedStartAt = new Date(scheduledStartAt);
      if (isNaN(parsedStartAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduledStartAt date format" },
          { status: 400 }
        );
      }
    }

    if (scheduledEndAt !== null && scheduledEndAt !== undefined) {
      if (typeof scheduledEndAt !== "string") {
        return NextResponse.json(
          { error: "scheduledEndAt must be an ISO string or null" },
          { status: 400 }
        );
      }
      parsedEndAt = new Date(scheduledEndAt);
      if (isNaN(parsedEndAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduledEndAt date format" },
          { status: 400 }
        );
      }
    }

    // Validate that end is not before start
    if (parsedStartAt && parsedEndAt && parsedEndAt < parsedStartAt) {
      return NextResponse.json(
        { error: "scheduledEndAt cannot be before scheduledStartAt" },
        { status: 400 }
      );
    }

    // Update the job
    job.scheduledStartAt = parsedStartAt ? parsedStartAt.toISOString() : null;
    job.scheduledEndAt = parsedEndAt ? parsedEndAt.toISOString() : null;
    job.scheduleNotes = scheduleNotes !== undefined ? (scheduleNotes?.trim() || null) : job.scheduleNotes;
    job.updatedAt = new Date().toISOString();

    // NOTE: Adding a schedule does NOT change job status.
    // Schedule represents proposed availability for client review.
    // Job status only changes to "booked" when:
    // 1. Client accepts the quote (moves to pending_confirmation)
    // 2. Tradie manually confirms by setting status to "booked"

    await saveJob(job);

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error updating job schedule:", error);
    return NextResponse.json(
      { error: "Failed to update job schedule" },
      { status: 500 }
    );
  }
}

