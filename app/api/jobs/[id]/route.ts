import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { isDemoUser } from "@/lib/demo";

/**
 * GET /api/jobs/[id]
 * Fetch a single job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    // Check ownership - user must own the job or be an admin
    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Don't return deleted jobs (unless admin)
    if (job.isDeleted === true && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update client details for a job (clientName, clientEmail only)
 * Only accessible by job owner, superadmin, or demo users
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id: jobId } = await params;

    // Get the job
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if user is a superadmin or demo user
    const isSuperAdmin = isAdmin(currentUser);
    const userIsDemoUser = isDemoUser(currentUser.email);

    // Verify ownership - superadmins, demo users, or job owners can update
    if (job.userId !== currentUser.id && !isSuperAdmin && !userIsDemoUser) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { clientName, clientEmail } = body;

    // Only allow updating clientName and clientEmail
    // Validate and update allowed fields
    const updates: { clientName?: string; clientEmail?: string } = {};

    if (clientName !== undefined) {
      if (typeof clientName !== "string") {
        return NextResponse.json(
          { success: false, error: "clientName must be a string" },
          { status: 400 }
        );
      }
      updates.clientName = clientName.trim() || undefined;
    }

    if (clientEmail !== undefined) {
      if (typeof clientEmail !== "string") {
        return NextResponse.json(
          { success: false, error: "clientEmail must be a string" },
          { status: 400 }
        );
      }
      const trimmedEmail = clientEmail.trim().toLowerCase();
      
      // Basic email validation
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid email address" },
          { status: 400 }
        );
      }
      
      updates.clientEmail = trimmedEmail || undefined;
    }

    // Update job with allowed fields only
    if (updates.clientName !== undefined) {
      job.clientName = updates.clientName;
    }
    if (updates.clientEmail !== undefined) {
      job.clientEmail = updates.clientEmail;
    }

    // Save the updated job
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
    console.error("Error updating job:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

