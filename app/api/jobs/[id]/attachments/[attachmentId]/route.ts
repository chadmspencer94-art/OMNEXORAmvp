import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/jobs/[id]/attachments/[attachmentId]
 * Get a single attachment (returns binary data)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only tradie/business/admin can view attachments
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot view attachments" },
        { status: 403 }
      );
    }

    const { id: jobId, attachmentId } = await context.params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership (unless admin)
    if (!isAdmin(user) && job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to view attachments for this job" },
        { status: 403 }
      );
    }

    // Load attachment (including dataBase64)
    const prisma = getPrisma();
    const attachment = await prisma.jobAttachment.findFirst({
      where: {
        id: attachmentId,
        jobId,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(attachment.dataBase64, "base64");

    // Return binary response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachment" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]/attachments/[attachmentId]
 * Update attachment caption
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only tradie/business/admin can update attachments
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot update attachments" },
        { status: 403 }
      );
    }

    const { id: jobId, attachmentId } = await context.params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership (unless admin)
    if (!isAdmin(user) && job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update attachments for this job" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { caption } = body;

    // Load attachment to ensure it exists and belongs to this job
    const prisma = getPrisma();
    const attachment = await prisma.jobAttachment.findFirst({
      where: {
        id: attachmentId,
        jobId,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Update caption
    const updated = await prisma.jobAttachment.update({
      where: { id: attachmentId },
      data: {
        caption: caption?.trim() || null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      fileName: updated.fileName,
      mimeType: updated.mimeType,
      fileSize: updated.fileSize,
      kind: updated.kind,
      caption: updated.caption,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating attachment:", error);
    return NextResponse.json(
      { error: "Failed to update attachment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]/attachments/[attachmentId]
 * Delete an attachment
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only tradie/business/admin can delete attachments
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot delete attachments" },
        { status: 403 }
      );
    }

    const { id: jobId, attachmentId } = await context.params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership (unless admin)
    if (!isAdmin(user) && job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete attachments for this job" },
        { status: 403 }
      );
    }

    // Load attachment to ensure it exists and belongs to this job
    const prisma = getPrisma();
    const attachment = await prisma.jobAttachment.findFirst({
      where: {
        id: attachmentId,
        jobId,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete attachment
    await prisma.jobAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}

