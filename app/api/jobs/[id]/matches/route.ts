import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { findMatchingTradiesForJob } from "@/lib/matching";

export async function GET(
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

    const { id: jobId } = await params;

    // Load the job to check ownership
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Auth check: Only admins, job owners, or builders can see matches
    const isAdmin = currentUser.isAdmin || currentUser.role === "admin";
    const isJobOwner = job.userId === currentUser.id;
    const isBuilder = currentUser.role === "builder";

    if (!isAdmin && !isJobOwner && !isBuilder) {
      return NextResponse.json(
        { error: "Not authorized to view job matches" },
        { status: 403 }
      );
    }

    // Find matching tradies
    const matches = await findMatchingTradiesForJob(jobId);

    return NextResponse.json({
      jobId,
      matches,
    });
  } catch (error) {
    console.error("Error finding matching tradies:", error);
    return NextResponse.json(
      { error: "Failed to find matching tradies" },
      { status: 500 }
    );
  }
}

