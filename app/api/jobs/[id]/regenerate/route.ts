import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, saveJob, generateJobPack } from "@/lib/jobs";

/**
 * POST /api/jobs/[id]/regenerate - Regenerate the AI job pack
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block clients from regenerating AI job packs
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients can only post jobs. AI job pack generation is available to verified trades and businesses." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow regeneration if AI pack is confirmed
    if (job.aiReviewStatus === "confirmed") {
      return NextResponse.json(
        { error: "Cannot regenerate a confirmed job pack. For major changes, create a new job or duplicate this one." },
        { status: 403 }
      );
    }

    // Don't allow regeneration if client has accepted and signed
    if (job.clientStatus === "accepted") {
      return NextResponse.json(
        { error: "This pack has been signed by the client. Create a variation instead of regenerating the original scope." },
        { status: 403 }
      );
    }

    // Don't allow regeneration if already generating or initial generation is pending
    if (job.status === "generating" || job.status === "ai_pending") {
      return NextResponse.json(
        { error: "Job pack is already being generated" },
        { status: 409 }
      );
    }

    // Set status to generating
    job.status = "generating";
    await saveJob(job);

    try {
      // Generate the new job pack (pass user to load business profile rates)
      const updatedJob = await generateJobPack(job, user);
      return NextResponse.json({ job: updatedJob });
    } catch (error) {
      // If generation fails, mark as failed
      console.error("Error generating job pack:", error);
      job.status = "ai_failed";
      await saveJob(job);
      return NextResponse.json(
        { error: "Failed to generate job pack" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in regenerate endpoint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

