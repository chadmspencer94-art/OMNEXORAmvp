import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { isDemoUser } from "@/lib/demo";

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * PATCH /api/jobs/[id]/client-details
 * Updates client details for a job (manual entry after AI generation)
 * Only accessible by non-client users who own the job, or superadmins, or demo users
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    // Await params (Next.js 16+ requires params to be a Promise)
    const params = await context.params;
    const jobId = params.id;

    // Get the job
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user is a superadmin or demo user
    const isSuperAdmin = isAdmin(currentUser);
    const userIsDemoUser = isDemoUser(currentUser.email);

    // Verify ownership - superadmins, demo users, or job owners can update
    if (job.userId !== currentUser.id && !isSuperAdmin && !userIsDemoUser) {
      return NextResponse.json(
        { error: "You don't have permission to edit this job." },
        { status: 403 }
      );
    }

    // Plan check: free users cannot save client details (bypass for superadmins and demo users)
    if (!isSuperAdmin && !userIsDemoUser) {
      const { hasPaidPlan } = await import("@/lib/planChecks");
      
      if (!hasPaidPlan(currentUser)) {
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

