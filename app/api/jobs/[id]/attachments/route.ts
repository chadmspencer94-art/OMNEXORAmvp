import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
];

/**
 * POST /api/jobs/[id]/attachments
 * Upload a new attachment for a job
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only tradie/business/admin can upload attachments
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot upload attachments" },
        { status: 403 }
      );
    }

    const { id: jobId } = await context.params;
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership (unless admin)
    if (!isAdmin(user) && job.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to add attachments to this job" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataBase64 = buffer.toString("base64");

    // Determine kind
    let kind = "OTHER";
    if (file.type.startsWith("image/")) {
      kind = "IMAGE";
    } else if (file.type === "application/pdf") {
      kind = "DOCUMENT";
    }

    // Create attachment
    const prisma = getPrisma();
    const attachment = await prisma.jobAttachment.create({
      data: {
        jobId: job.id,
        userId: user.id,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        kind,
        caption: caption?.trim() || null,
        dataBase64,
      },
    });

    // Return safe representation (exclude dataBase64)
    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      kind: attachment.kind,
      caption: attachment.caption,
      createdAt: attachment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/[id]/attachments
 * List attachments for a job
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id: jobId } = await context.params;
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

    // Fetch attachments (exclude dataBase64 for list view)
    const prisma = getPrisma();
    const attachments = await prisma.jobAttachment.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        kind: true,
        caption: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      attachments: attachments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

