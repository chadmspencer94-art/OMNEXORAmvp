import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs/[id]/signature/[signatureId]
 * Returns the signature image data URL for a given signature ID
 * Only accessible by the job owner (trade/business)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; signatureId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, signatureId } = await params;

    // Verify job exists and user owns it
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this job" },
        { status: 403 }
      );
    }

    // Fetch signature from Prisma
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
    });

    if (!signature) {
      return NextResponse.json(
        { error: "Signature not found" },
        { status: 404 }
      );
    }

    // Verify signature belongs to this job
    if (signature.jobId !== id) {
      return NextResponse.json(
        { error: "Signature does not belong to this job" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      imageDataUrl: signature.imageDataUrl,
    });
  } catch (error) {
    console.error("Error fetching signature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

