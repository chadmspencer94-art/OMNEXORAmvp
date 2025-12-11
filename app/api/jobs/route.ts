import { NextResponse } from "next/server";
import { getCurrentUser, incrementUserJobCount, getRealUserFromSession, isImpersonating, SESSION_COOKIE_NAME, isClient } from "@/lib/auth";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { createEmptyJob, generateJobPack, saveJob, type CreateJobData, type TradeType } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let jobId: string | null = null;

  try {
    console.log("[jobs] creating new job");
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      title, 
      tradeType, 
      propertyType, 
      address, 
      notes, 
      clientName, 
      clientEmail,
      labourRatePerHour,
      helperRatePerHour, // Legacy - kept for backwards compatibility
      helpers, // New: array of helpers
      materialsAreRoughEstimate,
      rateTemplateId,
    } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!propertyType || typeof propertyType !== "string" || propertyType.trim() === "") {
      return NextResponse.json(
        { error: "Property type is required" },
        { status: 400 }
      );
    }

    // Check if user is a client - clients don't need to provide client details
    const userIsClient = isClient(user);

    // Gate client job posting - require email verification
    if (userIsClient) {
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { emailVerifiedAt: true },
      });

      if (!prismaUser?.emailVerifiedAt) {
        return NextResponse.json(
          { error: "Please verify your email before posting a job." },
          { status: 403 }
        );
      }
    }

    // Client details are NOT required at job creation for privacy/safety
    // They will be entered manually after AI generation
    // Only validate if provided (for backwards compatibility with existing jobs)
    if (clientEmail && typeof clientEmail === "string" && clientEmail.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientEmail.trim())) {
        return NextResponse.json(
          { error: "Please enter a valid email address" },
          { status: 400 }
        );
      }
    }

    // Validate trade type (if provided, must be valid; defaults to "Painter" if not provided)
    const validTradeTypes: TradeType[] = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];
    if (tradeType !== undefined && !validTradeTypes.includes(tradeType)) {
      return NextResponse.json(
        { error: "Invalid trade type. Must be one of: Painter, Plasterer, Carpenter, Electrician, Other" },
        { status: 400 }
      );
    }
    const normalizedTradeType: TradeType = tradeType && validTradeTypes.includes(tradeType) 
      ? tradeType 
      : "Painter";

    // Parse and validate optional pricing fields (only relevant for tradies)
    const parsedLabourRate = !userIsClient && labourRatePerHour !== undefined && labourRatePerHour !== null && labourRatePerHour !== ""
      ? Number(labourRatePerHour)
      : null;
    const parsedHelperRate = !userIsClient && helperRatePerHour !== undefined && helperRatePerHour !== null && helperRatePerHour !== ""
      ? Number(helperRatePerHour)
      : null;

    // Validate rates are positive numbers if provided (only for tradies)
    if (!userIsClient) {
      if (parsedLabourRate !== null && (isNaN(parsedLabourRate) || parsedLabourRate <= 0)) {
        return NextResponse.json(
          { error: "Labour rate must be a positive number" },
          { status: 400 }
        );
      }
      if (parsedHelperRate !== null && (isNaN(parsedHelperRate) || parsedHelperRate <= 0)) {
        return NextResponse.json(
          { error: "Helper rate must be a positive number" },
          { status: 400 }
        );
      }
      // Validate helpers array if provided
      if (helpers !== undefined && helpers !== null) {
        if (!Array.isArray(helpers)) {
          return NextResponse.json(
            { error: "Helpers must be an array" },
            { status: 400 }
          );
        }
        for (const helper of helpers) {
          if (!helper.id || typeof helper.id !== "string") {
            return NextResponse.json(
              { error: "Each helper must have a valid id" },
              { status: 400 }
            );
          }
          if (!helper.ratePerHour || typeof helper.ratePerHour !== "number" || helper.ratePerHour <= 0) {
            return NextResponse.json(
              { error: "Each helper must have a positive rate per hour" },
              { status: 400 }
            );
          }
        }
      }
    }
    
    // For clients, use their own email/name
    // For tradies, client details are optional at creation (will be entered manually after AI generation)
    const finalClientName = userIsClient 
      ? (user.email.split("@")[0] || "Client") 
      : (clientName?.trim() || "");
    const finalClientEmail = userIsClient 
      ? user.email 
      : (clientEmail?.trim().toLowerCase() || "");

    // Auto-select default rate template if none provided and user is not a client
    let finalRateTemplateId = rateTemplateId || null;
    if (!userIsClient && !finalRateTemplateId) {
      try {
        const defaultTemplate = await (prisma as any).rateTemplate.findFirst({
          where: {
            userId: user.id,
            isDefault: true,
            AND: [
              {
                OR: [
                  { tradeType: null },
                  { tradeType: normalizedTradeType },
                ],
              },
              {
                OR: [
                  { propertyType: null },
                  { propertyType: propertyType.trim() },
                ],
              },
            ],
          },
        });
        if (defaultTemplate) {
          finalRateTemplateId = defaultTemplate.id;
        }
      } catch (error) {
        console.warn("Failed to auto-select default rate template:", error);
      }
    }

    // If rate template is selected, optionally pre-fill job rates from template
    let finalLabourRate = parsedLabourRate;
    let finalHelperRate = parsedHelperRate;
    if (!userIsClient && finalRateTemplateId && !finalLabourRate && !finalHelperRate) {
      try {
        const template = await (prisma as any).rateTemplate.findUnique({
          where: { id: finalRateTemplateId },
        });
        if (template) {
          // Pre-fill rates from template (user can still override)
          if (template.hourlyRate != null) {
            finalLabourRate = template.hourlyRate;
          }
          if (template.helperHourlyRate != null) {
            finalHelperRate = template.helperHourlyRate;
          }
        }
      } catch (error) {
        console.warn("Failed to load rate template for pre-fill:", error);
      }
    }

    // If no hourly rate provided and no rate template, use user's default hourlyRate from business settings
    if (!userIsClient && !finalLabourRate) {
      try {
        const prismaUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { hourlyRate: true },
        });
        if (prismaUser?.hourlyRate != null) {
          finalLabourRate = prismaUser.hourlyRate;
        }
      } catch (error) {
        // Silently fail - don't break job creation if business settings can't be loaded
      }
    }

    // Prepare job data
    const jobData: CreateJobData = {
      title: title.trim(),
      tradeType: normalizedTradeType,
      propertyType: propertyType.trim(),
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      labourRatePerHour: finalLabourRate,
      helperRatePerHour: finalHelperRate, // Legacy
      helpers: helpers && Array.isArray(helpers) && helpers.length > 0 ? helpers : undefined, // New: array of helpers
      materialsAreRoughEstimate: materialsAreRoughEstimate === true,
      rateTemplateId: finalRateTemplateId,
    };

    // Get real admin if impersonating (for audit logging)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const impersonating = sessionId ? await isImpersonating() : false;
    const realAdmin = impersonating && sessionId ? await getRealUserFromSession(sessionId) : null;

    // Create the job
    const job = await createEmptyJob(user.id, jobData);
    jobId = job.id;

    // Set assignment metadata for client jobs
    let updatedJob = job;
    if (userIsClient) {
      updatedJob.leadSource = "CLIENT_PORTAL";
      updatedJob.clientUserId = user.id;
      updatedJob.assignmentStatus = "UNASSIGNED";
      updatedJob.status = "draft"; // No AI generation for client posts
      await saveJob(updatedJob);
    } else {
      // For tradie-created jobs, set leadSource to MANUAL
      updatedJob.leadSource = "MANUAL";
      
      // Link to Client CRM if client details are provided
      if (finalClientName && finalClientEmail) {
        try {
          const { findOrCreateClientForJob } = await import("@/lib/clientCrm");
          // Extract suburb from address if available
          const suburb = address ? extractSuburbFromAddress(address) : undefined;
          
          const { clientId } = await findOrCreateClientForJob({
            ownerUserId: user.id,
            name: finalClientName,
            email: finalClientEmail,
            suburb: suburb,
          });
          
          updatedJob.clientId = clientId;
        } catch (error) {
          // Log but don't fail job creation if client linking fails
          console.error("Failed to link client to job:", error);
        }
      }
      
      await saveJob(updatedJob);
    }

    // Track activity and increment job count
    incrementUserJobCount(user.id).catch((err) => {
      console.error("Failed to increment job count:", err);
    });

    // Log audit if impersonating
    if (impersonating && realAdmin) {
      createAuditLog({
        adminId: realAdmin.id,
        actingAsUserId: user.id,
        action: "JOB_CREATED_AS_USER",
        metadata: { jobId: job.id, jobTitle: job.title },
      }).catch((err) => {
        console.error("Failed to create audit log:", err);
      });
    }

    // Only generate AI job pack for tradies (not for client job posts)
    if (!userIsClient) {
      try {
        console.log(`[jobs] generating job pack for job ${updatedJob.id}`);
        // Generate AI job pack (pass user to load business profile rates)
        updatedJob = await generateJobPack(updatedJob, user);
        console.log(`[jobs] successfully generated job pack for job ${updatedJob.id}`);
      } catch (packError: any) {
        console.error("Error generating job pack:", packError);
        
        // Handle specific error types with better messages
        let errorMessage = "Failed to generate job pack. Please try again.";
        let statusCode = 500;
        
        if (packError?.message?.includes("EMAIL_NOT_VERIFIED")) {
          errorMessage = "Please verify your email address before generating job packs. Check your email for a verification link.";
          statusCode = 403;
        } else if (packError?.message) {
          // Include the actual error message for debugging
          errorMessage = packError.message;
        }
        
        // Mark job as failed
        if (jobId) {
          try {
            const { getJobById } = await import("@/lib/jobs");
            const failedJob = await getJobById(jobId);
            if (failedJob) {
              failedJob.status = "ai_failed";
              await saveJob(failedJob);
            }
          } catch (saveError) {
            console.error("Error saving failed status:", saveError);
          }
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    }

    console.log(`[jobs] successfully created job ${updatedJob.id}`);
    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (error: any) {
    console.error("[jobs] error creating job:", error);

    // If we have a job ID, try to mark it as failed
    if (jobId) {
      try {
        const { getJobById } = await import("@/lib/jobs");
        const failedJob = await getJobById(jobId);
        if (failedJob) {
          failedJob.status = "ai_failed";
          await saveJob(failedJob);
        }
      } catch (saveError) {
        console.error("Error saving failed status:", saveError);
      }
    }

    // Provide more specific error messages
    let errorMessage = "Failed to generate job pack. Please try again.";
    if (error?.message?.includes("EMAIL_NOT_VERIFIED")) {
      errorMessage = "Please verify your email address before generating job packs. Check your email for a verification link.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Helper to extract suburb from address string
 */
function extractSuburbFromAddress(address: string): string | undefined {
  // Try to extract suburb (word before postcode, or common suburb patterns)
  const postcodeMatch = address.match(/\b(\d{4})\b/);
  if (postcodeMatch) {
    const beforePostcode = address.substring(0, address.indexOf(postcodeMatch[1])).trim();
    const words = beforePostcode.split(/[,\s]+/);
    if (words.length > 0) {
      return words[words.length - 1]; // Last word before postcode
    }
  }
  return undefined;
}

