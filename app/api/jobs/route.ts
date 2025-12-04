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
    const { title, tradeType, propertyType, address, notes } = body;

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

    // Validate trade type
    const validTradeTypes: TradeType[] = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];
    const normalizedTradeType: TradeType = validTradeTypes.includes(tradeType) 
      ? tradeType 
      : "Painter";

    // Prepare job data
    const jobData: CreateJobData = {
      title: title.trim(),
      tradeType: normalizedTradeType,
      propertyType: propertyType.trim(),
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined,
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

