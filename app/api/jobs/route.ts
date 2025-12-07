import { NextResponse } from "next/server";
import { getCurrentUser, incrementUserJobCount, getRealUserFromSession, isImpersonating, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { createEmptyJob, generateJobPack, saveJob, type CreateJobData, type TradeType } from "@/lib/jobs";

export async function POST(request: Request) {
  let jobId: string | null = null;

  try {
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
      helperRatePerHour,
      materialsAreRoughEstimate,
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
    const isClient = user.role === "client";

    // Validate client name (only required for tradies creating quotes)
    if (!isClient) {
      if (!clientName || typeof clientName !== "string" || clientName.trim() === "") {
        return NextResponse.json(
          { error: "Client name is required" },
          { status: 400 }
        );
      }

      // Validate client email (only required for tradies)
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
    const parsedLabourRate = !isClient && labourRatePerHour !== undefined && labourRatePerHour !== null && labourRatePerHour !== ""
      ? Number(labourRatePerHour)
      : null;
    const parsedHelperRate = !isClient && helperRatePerHour !== undefined && helperRatePerHour !== null && helperRatePerHour !== ""
      ? Number(helperRatePerHour)
      : null;

    // Validate rates are positive numbers if provided (only for tradies)
    if (!isClient) {
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
    }
    
    // For clients, use their own email/name instead of requiring client details
    const finalClientName = isClient ? (user.email.split("@")[0] || "Client") : clientName.trim();
    const finalClientEmail = isClient ? user.email : clientEmail.trim().toLowerCase();

    // Prepare job data
    const jobData: CreateJobData = {
      title: title.trim(),
      tradeType: normalizedTradeType,
      propertyType: propertyType.trim(),
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      labourRatePerHour: parsedLabourRate,
      helperRatePerHour: parsedHelperRate,
      materialsAreRoughEstimate: materialsAreRoughEstimate === true,
    };

    // Get real admin if impersonating (for audit logging)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const impersonating = sessionId ? await isImpersonating() : false;
    const realAdmin = impersonating && sessionId ? await getRealUserFromSession(sessionId) : null;

    // Create the job
    const job = await createEmptyJob(user.id, jobData);
    jobId = job.id;

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
    let updatedJob = job;
    if (!isClient) {
      // Generate AI job pack (pass user to load business profile rates)
      updatedJob = await generateJobPack(job, user);
    } else {
      // For client posts, set status to draft (no AI generation)
      updatedJob.status = "draft";
      await saveJob(updatedJob);
    }

    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (error) {
    console.error("Error creating job:", error);

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

    return NextResponse.json(
      { error: "Failed to generate job pack. Please try again." },
      { status: 500 }
    );
  }
}

