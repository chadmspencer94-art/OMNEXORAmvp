import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

/**
 * PATCH /api/jobs/[id]/pack-sections
 * Updates job pack section fields (e.g. aiScopeOfWork, aiInclusions, aiExclusions, etc.)
 */
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { id: jobId } = await params;
    console.log(`[pack-sections] updating job ${jobId} pack sections`);

    // Load job and check ownership
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body to get field updates
    const body = await req.json();
    const allowedFields = [
      "aiScopeOfWork",
      "aiInclusions",
      "aiExclusions",
      "aiMaterials",
      "aiQuote",
      "aiClientNotes",
      "aiSummary",
    ];

    // Validate that only allowed fields are being updated
    const updates: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        // Allow null, empty string, or valid strings
        const value = body[field];
        updates[field] = value === "" || value === null ? null : String(value);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Apply updates to job
    const updatedJob = { ...job, ...updates };
    await saveJob(updatedJob);

    console.log(`[pack-sections] successfully updated job ${jobId} pack sections`);
    return NextResponse.json({ success: true, job: updatedJob }, { status: 200 });
  } catch (error: any) {
    console.error("[pack-sections] error updating pack sections:", error);
    const errorMessage = error?.message || "Failed to update pack sections. Please try again.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * POST /api/jobs/[id]/pack-sections
 * Stub route for regenerating / fetching job pack sections.
 * Currently returns 501 Not Implemented.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: jobId } = await params;

  // Basic ownership/admin check
  try {
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (error) {
    console.error("[pack-sections] error checking job", error);
    return NextResponse.json(
      { error: "Error checking job ownership" },
      { status: 500 }
    );
  }

  // Stub response for now
  return NextResponse.json(
    {
      status: "not_implemented",
      message:
        "Pack sections regeneration API is not implemented yet. Use PATCH to update individual sections.",
    },
    { status: 501 }
  );
}
