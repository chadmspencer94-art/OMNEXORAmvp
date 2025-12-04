import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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

    // Validate client name (required for new jobs)
    if (!clientName || typeof clientName !== "string" || clientName.trim() === "") {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // Validate client email (required for new jobs)
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

    // Parse and validate optional pricing fields
    const parsedLabourRate = labourRatePerHour !== undefined && labourRatePerHour !== null && labourRatePerHour !== ""
      ? Number(labourRatePerHour)
      : null;
    const parsedHelperRate = helperRatePerHour !== undefined && helperRatePerHour !== null && helperRatePerHour !== ""
      ? Number(helperRatePerHour)
      : null;

    // Validate rates are positive numbers if provided
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

    // Prepare job data
    const jobData: CreateJobData = {
      title: title.trim(),
      tradeType: normalizedTradeType,
      propertyType: propertyType.trim(),
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      labourRatePerHour: parsedLabourRate,
      helperRatePerHour: parsedHelperRate,
      materialsAreRoughEstimate: materialsAreRoughEstimate === true,
    };

    // Create the job with ai_pending status
    const job = await createEmptyJob(user.id, jobData);
    jobId = job.id;

    // Generate AI job pack
    const updatedJob = await generateJobPack(job);

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

