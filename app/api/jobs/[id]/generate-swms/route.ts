import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { requireVerifiedUser, UserNotVerifiedError } from "@/lib/authChecks";
import { getJobById, generateSWMS, saveJob } from "@/lib/jobs";

/**
 * POST /api/jobs/[id]/generate-swms
 * Generates a SWMS (Safe Work Method Statement) for the specified job
 * 
 * VERIFICATION GATE: Requires business verification before generating documents.
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

    // VERIFICATION GATE: Require business verification before document generation
    try {
      await requireVerifiedUser(user);
    } catch (error) {
      if (error instanceof UserNotVerifiedError) {
        return NextResponse.json(
          { error: error.message, code: "VERIFICATION_REQUIRED" },
          { status: 403 }
        );
      }
      throw error;
    }

    // Get job ID from params
    const { id } = await params;
    console.log(`[jobs] generate swms for job ${id}`);
    
    const job = await getJobById(id);

    if (!job) {
      console.error(`[jobs] job ${id} not found for SWMS generation`);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      console.error(`[jobs] user ${user.id} not authorized to generate SWMS for job ${id}`);
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to generate SWMS for this job." },
        { status: 403 }
      );
    }

    // Generate SWMS
    const updatedJob = await generateSWMS(job, user);
    console.log(`[jobs] successfully generated SWMS for job ${id}`);

    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (error: any) {
    console.error("[jobs] error generating SWMS:", error);
    const errorMessage = error?.message || "Failed to generate SWMS. Please try again.";
    
    // Check if it's an OpenAI API key error
    if (errorMessage.includes("API key") || errorMessage.includes("OpenAI")) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please contact support." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

