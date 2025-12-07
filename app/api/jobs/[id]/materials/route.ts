import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this job." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { materialsOverrideText } = body;

    // Validate the materialsOverrideText field
    if (materialsOverrideText !== null && typeof materialsOverrideText !== "string") {
      return NextResponse.json(
        { error: "Invalid materials override text" },
        { status: 400 }
      );
    }

    // Update the job with the new materials override
    // Convert empty strings to null for consistency
    job.materialsOverrideText = (materialsOverrideText && materialsOverrideText.trim()) || null;
    job.updatedAt = new Date().toISOString();

    await saveJob(job);

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Error updating materials override:", error);
    return NextResponse.json(
      { error: "Failed to update materials. Please try again." },
      { status: 500 }
    );
  }
}

