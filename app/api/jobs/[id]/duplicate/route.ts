import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, cloneJobForUser } from "@/lib/jobs";

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/jobs/[id]/duplicate
 * Duplicates a job for the current user
 * Only accessible by non-client users (tradie/business/builder/admin)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only non-client users can duplicate jobs
    if (isClient(currentUser)) {
      return NextResponse.json(
        { error: "Clients cannot duplicate jobs" },
        { status: 403 }
      );
    }

    // Get jobId from route params
    const params = await Promise.resolve(context.params);
    const jobId = params.id;

    // Verify the job exists and belongs to the user
    const sourceJob = await getJobById(jobId);
    if (!sourceJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (sourceJob.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "You do not have permission to duplicate this job" },
        { status: 403 }
      );
    }

    // Clone the job
    const clonedJob = await cloneJobForUser({
      jobId,
      userId: currentUser.id,
    });

    // Return success with the new job ID
    return NextResponse.json({
      success: true,
      jobId: clonedJob.id,
    });
  } catch (error: any) {
    console.error("Error duplicating job:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

