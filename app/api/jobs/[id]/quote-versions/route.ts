import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/jobs/[id]/quote-versions
 * Get quote version history for a job
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Block clients
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot view quote history" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Load job to verify ownership
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Authorization: ensure user owns this job or is admin
    if (job.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized to access this job" },
        { status: 403 }
      );
    }

    // Fetch quote versions
    const prisma = getPrisma();
    const versions = await (prisma as any).jobQuoteVersion.findMany({
      where: { jobId: id },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({
      versions: versions.map((v: any) => ({
        id: v.id,
        version: v.version,
        sentAt: v.sentAt.toISOString(),
        quoteExpiryAt: v.quoteExpiryAt ? v.quoteExpiryAt.toISOString() : null,
        totalInclGst: v.totalInclGst != null ? Number(v.totalInclGst) : null,
        summary: v.summary,
        scopeOfWork: v.scopeOfWork,
        inclusions: v.inclusions,
        exclusions: v.exclusions,
        materialsText: v.materialsText,
        clientNotes: v.clientNotes,
      })),
    });
  } catch (error) {
    console.error("Error fetching quote versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote versions" },
      { status: 500 }
    );
  }
}

