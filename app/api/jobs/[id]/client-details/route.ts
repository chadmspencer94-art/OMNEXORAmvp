import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * PATCH /api/jobs/[id]/client-details
 * Updates client details for a job (manual entry after AI generation)
 * Only accessible by non-client users who own the job
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only non-client users can update client details
    if (isClient(currentUser)) {
      return NextResponse.json(
        { error: "Clients cannot update client details" },
        { status: 403 }
      );
    }

    // Get jobId from route params
    const params = await Promise.resolve(context.params);
    const jobId = params.id;

    // Get the job
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify ownership - admins can update any job
    const { isAdmin } = await import("@/lib/auth");
    if (job.userId !== currentUser.id && !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: "You do not have permission to update this job" },
        { status: 403 }
      );
    }

    // Plan check: free users cannot save client details
    const { hasPaidPlan } = await import("@/lib/planChecks");
    const { isAdmin } = await import("@/lib/auth");
    
    if (!hasPaidPlan(currentUser) && !isAdmin(currentUser)) {
      // Get plan tier from Prisma
      let planTier = "FREE";
      try {
        const { prisma } = await import("@/lib/prisma");
        const prismaUser = await prisma.user.findUnique({
          where: { email: currentUser.email },
          select: { planTier: true },
        });
        if (prismaUser?.planTier) {
          planTier = prismaUser.planTier;
        }
      } catch (error) {
        console.warn("Failed to fetch plan tier:", error);
      }
      
      if (planTier === "FREE") {
        return NextResponse.json(
          {
            error: "A paid membership is required to save client details and send job packs. Please upgrade your plan to continue.",
            code: "PAID_PLAN_REQUIRED"
          },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { clientName, clientEmail } = body;

    // Validate
    if (!clientName || typeof clientName !== "string" || clientName.trim() === "") {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!clientEmail || typeof clientEmail !== "string" || clientEmail.trim() === "") {
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Update job with client details
    job.clientName = clientName.trim();
    job.clientEmail = clientEmail.trim().toLowerCase();
    await saveJob(job);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        clientName: job.clientName,
        clientEmail: job.clientEmail,
      },
    });
  } catch (error: any) {
    console.error("Error updating client details:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

