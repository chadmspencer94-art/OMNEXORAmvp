import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma, getSafeErrorMessage, isPrismaError } from "@/lib/prisma";

// User-friendly error message for safety document operations
const SAFETY_DOC_ERROR = "Unable to save safety document right now. Please try again shortly.";

/**
 * POST /api/jobs/[id]/safety/[docId]
 * Update a safety document
 * Auth: tradie/business only, must own the job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Block clients from updating safety documents
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Access denied. Safety documents are internal only." },
        { status: 403 }
      );
    }

    const { id: jobId, docId } = await params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user owns the job or is an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden. You don't have permission to update safety documents for this job." },
        { status: 403 }
      );
    }

    // Check if document exists and belongs to this job
    const prisma = getPrisma();
    let document;
    try {
      document = await prisma.jobSafetyDocument.findFirst({
        where: { id: docId, jobId },
      });
    } catch (dbError) {
      console.error("[safety] Database error finding document:", dbError);
      return NextResponse.json(
        { error: SAFETY_DOC_ERROR },
        { status: 503 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Safety document not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, status } = body;

    // Validate required fields
    if (content === undefined) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Update document
    let updated;
    try {
      updated = await prisma.jobSafetyDocument.update({
        where: { id: docId },
        data: {
          ...(title !== undefined && { title }),
          content,
          ...(status !== undefined && { status }),
        },
      });
    } catch (dbError) {
      console.error("[safety] Database error updating document:", dbError);
      return NextResponse.json(
        { error: SAFETY_DOC_ERROR },
        { status: 503 }
      );
    }

    return NextResponse.json({ document: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating safety document:", error);
    
    // Return safe error message, filtering out Prisma internals
    const safeMessage = isPrismaError(error) 
      ? SAFETY_DOC_ERROR 
      : getSafeErrorMessage(error, SAFETY_DOC_ERROR);
    
    return NextResponse.json(
      { error: safeMessage },
      { status: 500 }
    );
  }
}

