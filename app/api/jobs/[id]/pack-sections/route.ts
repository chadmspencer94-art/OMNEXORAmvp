import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

/**
 * PATCH /api/jobs/[id]/pack-sections
 * Updates a specific section of the AI job pack (scope, inclusions, exclusions, client notes, summary)
 * This allows manual editing without triggering regeneration
 */
export async function PATCH(
  request: NextRequest,
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
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this job." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      aiScopeOfWork,
      aiInclusions,
      aiExclusions,
      aiClientNotes,
      aiSummary,
    } = body;

    let updated = false;

    // Update each field if provided
    if (aiScopeOfWork !== undefined) {
      if (typeof aiScopeOfWork !== "string" && aiScopeOfWork !== null) {
        return NextResponse.json(
          { error: "aiScopeOfWork must be a string or null" },
          { status: 400 }
        );
      }
      job.aiScopeOfWork = aiScopeOfWork?.trim() || null;
      updated = true;
    }

    if (aiInclusions !== undefined) {
      if (typeof aiInclusions !== "string" && aiInclusions !== null) {
        return NextResponse.json(
          { error: "aiInclusions must be a string or null" },
          { status: 400 }
        );
      }
      job.aiInclusions = aiInclusions?.trim() || null;
      updated = true;
    }

    if (aiExclusions !== undefined) {
      if (typeof aiExclusions !== "string" && aiExclusions !== null) {
        return NextResponse.json(
          { error: "aiExclusions must be a string or null" },
          { status: 400 }
        );
      }
      job.aiExclusions = aiExclusions?.trim() || null;
      updated = true;
    }

    if (aiClientNotes !== undefined) {
      if (typeof aiClientNotes !== "string" && aiClientNotes !== null) {
        return NextResponse.json(
          { error: "aiClientNotes must be a string or null" },
          { status: 400 }
        );
      }
      job.aiClientNotes = aiClientNotes?.trim() || null;
      updated = true;
    }

    if (aiSummary !== undefined) {
      if (typeof aiSummary !== "string" && aiSummary !== null) {
        return NextResponse.json(
          { error: "aiSummary must be a string or null" },
          { status: 400 }
        );
      }
      job.aiSummary = aiSummary?.trim() || null;
      updated = true;
    }

    if (!updated) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Note: We do NOT change job.status to "pending_regeneration" here
    // This is intentional - manual edits are allowed even after confirmation
    // and should not trigger regeneration

    await saveJob(job);

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error updating job pack sections:", error);
    return NextResponse.json(
      { error: "Failed to update job pack sections. Please try again." },
      { status: 500 }
    );
  }
}

