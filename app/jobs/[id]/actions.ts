"use server";

import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { revalidatePath } from "next/cache";
import { isDemoUser } from "@/lib/demo";

/**
 * Server Action to update client details for a job
 * Only accessible by non-client users who own the job, or superadmins, or demo users
 */
export async function updateClientDetails(
  jobId: string,
  clientName: string,
  clientEmail: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    // ========================================================================
    // Input Validation
    // ========================================================================
    if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
      console.error("[updateClientDetails] Invalid jobId:", jobId);
      return { ok: false, message: "Invalid job ID" };
    }

    if (!clientName || typeof clientName !== "string" || clientName.trim() === "") {
      return { ok: false, message: "Client name is required" };
    }

    if (!clientEmail || typeof clientEmail !== "string" || clientEmail.trim() === "") {
      return { ok: false, message: "Client email is required" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = clientEmail.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      return { ok: false, message: "Please enter a valid email address" };
    }

    // ========================================================================
    // Authentication & Authorization
    // ========================================================================
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { ok: false, message: "Not authenticated" };
    }

    // Only non-client users can update client details
    if (isClient(currentUser)) {
      return { ok: false, message: "Clients cannot update client details" };
    }

    // Check if user is a superadmin
    const isSuperAdmin = isAdmin(currentUser);
    
    // Check if user is a demo user
    const userIsDemoUser = isDemoUser(currentUser.email);

    // ========================================================================
    // Get and Verify Job
    // ========================================================================
    let job;
    try {
      job = await getJobById(jobId);
    } catch (getJobError: any) {
      console.error("[updateClientDetails] Error getting job:", {
        jobId,
        error: getJobError?.message,
        stack: getJobError?.stack,
        code: getJobError?.code,
      });
      return { ok: false, message: `Failed to load job: ${getJobError?.message || "Unknown error"}` };
    }

    if (!job) {
      console.error("[updateClientDetails] Job not found:", jobId);
      return { ok: false, message: "Job not found" };
    }

    // Verify ownership - superadmins, demo users, or job owners can update
    if (job.userId !== currentUser.id && !isSuperAdmin && !userIsDemoUser) {
      return { ok: false, message: "You don't have permission to edit this job." };
    }

    // ========================================================================
    // Plan Check (bypass for superadmins and demo users)
    // ========================================================================
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
          console.warn("[updateClientDetails] Failed to fetch plan tier:", error);
        }
        
        if (planTier === "FREE") {
          return {
            ok: false,
            message: "A paid membership is required to save client details and send job packs. Please upgrade your plan to continue.",
          };
        }
      }
    }

    // ========================================================================
    // Update Job with Client Details
    // ========================================================================
    const trimmedName = clientName.trim();
    job.clientName = trimmedName;
    job.clientEmail = trimmedEmail;
    
    try {
      await saveJob(job);
      console.log("[updateClientDetails] Successfully saved client details:", {
        jobId,
        clientName: trimmedName,
        clientEmail: trimmedEmail,
        userId: currentUser.id,
        isSuperAdmin,
        isDemoUser: userIsDemoUser,
      });
    } catch (saveError: any) {
      console.error("[updateClientDetails] Error saving job to KV store:", {
        jobId,
        error: saveError?.message,
        stack: saveError?.stack,
        code: saveError?.code,
        name: saveError?.name,
        cause: saveError?.cause,
      });
      return { 
        ok: false, 
        message: `Failed to save client details: ${saveError?.message || "Database error. Please try again."}` 
      };
    }

    // ========================================================================
    // Revalidate Path
    // ========================================================================
    try {
      revalidatePath(`/jobs/${jobId}`);
    } catch (revalidateError: any) {
      console.warn("[updateClientDetails] Error revalidating path:", {
        jobId,
        error: revalidateError?.message,
        stack: revalidateError?.stack,
      });
      // Don't fail the operation if revalidation fails - data is already saved
    }

    return { ok: true };
  } catch (error: any) {
    console.error("[updateClientDetails] Unexpected error:", {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
    });
    return { 
      ok: false, 
      message: error?.message || "An unexpected error occurred. Please try again." 
    };
  }
}

