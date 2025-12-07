import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById, generateSWMS, saveJob } from "@/lib/jobs";

/**
 * POST /api/jobs/[id]/generate-swms
 * Generates a SWMS (Safe Work Method Statement) for the specified job
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

    // Get job ID from params
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to generate SWMS for this job." },
        { status: 403 }
      );
    }

    // Generate SWMS
    const updatedJob = await generateSWMS(job, user);

    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (error) {
    console.error("Error generating SWMS:", error);
    return NextResponse.json(
      { error: "Failed to generate SWMS. Please try again." },
      { status: 500 }
    );
  }
}

