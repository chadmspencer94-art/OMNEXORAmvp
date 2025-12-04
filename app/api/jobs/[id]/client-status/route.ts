import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob, type ClientStatus } from "@/lib/jobs";

interface UpdateClientStatusBody {
  clientStatus: ClientStatus;
}

const VALID_CLIENT_STATUSES: ClientStatus[] = ["draft", "sent", "accepted", "declined", "cancelled"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Load job
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Authorization: ensure user owns this job
    if (job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this job" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as UpdateClientStatusBody;
    const { clientStatus } = body;

    // Validate client status
    if (!clientStatus || !VALID_CLIENT_STATUSES.includes(clientStatus)) {
      return NextResponse.json(
        { error: `Invalid client status. Must be one of: ${VALID_CLIENT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Update client status
    job.clientStatus = clientStatus;
    job.clientStatusUpdatedAt = new Date().toISOString();

    await saveJob(job);

    console.log(`[JOB] Client status for job ${job.id} changed to "${clientStatus}" by user ${user.email}`);

    return NextResponse.json({
      success: true,
      clientStatus: job.clientStatus,
      clientStatusUpdatedAt: job.clientStatusUpdatedAt,
    });
  } catch (error) {
    console.error("Error updating client status:", error);
    return NextResponse.json(
      { error: "Failed to update client status" },
      { status: 500 }
    );
  }
}

