import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { createJobDocumentSignature, type JobDocumentType } from "@/lib/jobDocumentSignatures";

/**
 * POST /api/jobs/[id]/sign-document
 * Allows CLIENT users to sign job documents (QUOTE, VARIATION, EOT, HANDOVER)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Only allow CLIENT role to sign documents
    if (!isClient(user)) {
      return NextResponse.json(
        { error: "Only clients can sign documents." },
        { status: 403 }
      );
    }

    // Get job ID from params
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify that this user is the client for this job
    // Match by email (since jobs store clientEmail)
    if (job.clientEmail?.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You can only sign documents for jobs associated with your account." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { docType, docKey, signedName, signatureImage } = body;

    // Validate required fields
    if (!docType || typeof docType !== "string") {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

    const validDocTypes: JobDocumentType[] = ["QUOTE", "VARIATION", "EOT", "HANDOVER"];
    if (!validDocTypes.includes(docType as JobDocumentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (!signedName || typeof signedName !== "string" || signedName.trim() === "") {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    // Signature image is optional but preferred
    if (signatureImage && typeof signatureImage !== "string") {
      return NextResponse.json(
        { error: "Invalid signature image format" },
        { status: 400 }
      );
    }

    // Get IP address and user agent for audit
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // Create the signature
    const signature = await createJobDocumentSignature({
      jobId: id,
      userId: user.id,
      role: "CLIENT",
      docType: docType as JobDocumentType,
      docKey: docKey || null,
      signedName: signedName.trim(),
      signatureImage: signatureImage || null,
      ipAddress,
      userAgent,
    });

    // If signing the main QUOTE, update job client status to "accepted"
    if (docType === "QUOTE") {
      const now = new Date().toISOString();
      job.clientStatus = "accepted";
      job.clientStatusUpdatedAt = now;
      await saveJob(job);
    }

    return NextResponse.json(
      {
        success: true,
        signature: {
          id: signature.id,
          signedName: signature.signedName,
          signedAt: signature.signedAt.toISOString(),
          docType: signature.docType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error signing document:", error);
    return NextResponse.json(
      { error: "Failed to sign document. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/[id]/sign-document
 * Gets signature status for a job document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get job ID from params
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check access: user must own the job OR be the client for the job
    const isJobOwner = job.userId === user.id;
    const isClientForJob = isClient(user) && job.clientEmail?.toLowerCase() === user.email.toLowerCase();

    if (!isJobOwner && !isClientForJob) {
      return NextResponse.json(
        { error: "You don't have permission to view signatures for this job." },
        { status: 403 }
      );
    }

    // Get query params for docType and docKey
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType") as JobDocumentType | null;
    const docKey = searchParams.get("docKey") || null;
    const includeImage = searchParams.get("includeImage") === "true";

    if (!docType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

    const { getJobDocumentSignature } = await import("@/lib/jobDocumentSignatures");
    const signature = await getJobDocumentSignature(id, docType, docKey);

    if (!signature) {
      return NextResponse.json(
        { success: true, signature: null },
        { status: 200 }
      );
    }

    // Return signature info (hide sensitive audit fields from client view)
    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        signedName: signature.signedName,
        signedAt: signature.signedAt.toISOString(),
        docType: signature.docType,
        docKey: signature.docKey,
        hasSignatureImage: !!signature.signatureImage,
        // Only include signature image for job owners (trades) or if explicitly requested
        ...(isJobOwner || includeImage
          ? {
              signatureImage: signature.signatureImage,
            }
          : {}),
        // Only include IP/userAgent for job owners (trades), not clients
        ...(isJobOwner
          ? {
              ipAddress: signature.ipAddress,
              userAgent: signature.userAgent,
            }
          : {}),
      },
    });
  } catch (error) {
    console.error("Error fetching signature:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature." },
      { status: 500 }
    );
  }
}

