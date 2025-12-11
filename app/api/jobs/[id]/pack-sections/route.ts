import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";

/**
 * Stub route for regenerating / fetching job pack sections.
 * Currently returns 501 Not Implemented.
 * This keeps TypeScript and Next.js happy until the full logic is built.
 */

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: jobId } = await params;

  // Basic ownership/admin check – safe, even if getJobById is a thin wrapper
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
        "Pack sections API exists but implementation is not finished yet.",
    },
    { status: 501 }
  );
}
