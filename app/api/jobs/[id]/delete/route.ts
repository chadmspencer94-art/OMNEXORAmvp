import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById, softDeleteJob } from "@/lib/jobs";

export async function PATCH(
  request: Request,
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

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Authorization: ensure user owns this job OR is admin (admins can delete any job)
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this job." },
        { status: 403 }
      );
    }

    // Check if already deleted
    if (job.isDeleted === true) {
      return NextResponse.json(
        { error: "Job is already removed" },
        { status: 400 }
      );
    }

    // Soft delete the job
    const deletedJob = await softDeleteJob(id);

    if (!deletedJob) {
      return NextResponse.json(
        { error: "Failed to remove job" },
        { status: 500 }
      );
    }

    console.log(`[JOB] Job ${id} soft-deleted by user ${user.email}`);

    return NextResponse.json({ success: true, job: deletedJob });
  } catch (error) {
    console.error("Error soft-deleting job:", error);
    return NextResponse.json(
      { error: "Failed to remove job. Please try again." },
      { status: 500 }
    );
  }
}

