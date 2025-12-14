import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById, saveJob } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";
import { sendJobPackEmail } from "@/lib/email";

/**
 * POST /api/admin/jobs/[id]/assign
 * Admin-only endpoint to assign a client job to a tradie/business
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check - admin only
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      );
    }

    const { id: jobId } = await context.params;
    const body = await request.json();
    const { tradieUserId } = body;

    if (!tradieUserId || typeof tradieUserId !== "string") {
      return NextResponse.json(
        { error: "tradieUserId is required" },
        { status: 400 }
      );
    }

    // Load the job
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Ensure it's a client job that can be assigned
    if (job.leadSource !== "CLIENT_PORTAL" && job.assignmentStatus !== "UNASSIGNED") {
      // Allow assignment if it's a client portal job or explicitly unassigned
      if (job.leadSource !== "CLIENT_PORTAL") {
        return NextResponse.json(
          { error: "This job cannot be assigned (not a client portal job)" },
          { status: 400 }
        );
      }
    }

    // Load the tradie user
    const prisma = getPrisma();
    const tradie = await prisma.user.findUnique({
      where: { id: tradieUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        accountStatus: true,
        businessName: true,
        tradingName: true,
      },
    });

    if (!tradie) {
      return NextResponse.json(
        { error: "Tradie user not found" },
        { status: 404 }
      );
    }

    // Validate tradie is eligible
    if (tradie.role === "client") {
      return NextResponse.json(
        { error: "Cannot assign job to a client account" },
        { status: 400 }
      );
    }

    if (tradie.isBanned || tradie.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cannot assign job to banned or inactive account" },
        { status: 400 }
      );
    }

    // Perform assignment
    const now = new Date().toISOString();
    const oldUserId = job.userId; // Store old owner for job list update
    
    // Update job ownership and assignment fields
    job.userId = tradieUserId; // Change ownership to tradie
    job.assignedByUserId = user.id;
    job.assignedAt = now;
    job.assignmentStatus = "ASSIGNED";
    job.leadSource = job.leadSource || "CLIENT_PORTAL"; // Ensure leadSource is set
    job.updatedAt = now;

    await saveJob(job);

    // Update job lists: add to tradie's list, keep in client's list if it was a client job
    const { kv } = await import("@/lib/kv");
    const tradieJobsKey = `user:${tradieUserId}:jobs`;
    
    // Add job to tradie's job list (prepend so it appears at top)
    try {
      await kv.lpush(tradieJobsKey, jobId);
    } catch (error) {
      console.error("Failed to add job to tradie's job list:", error);
      // Don't fail the assignment if this fails - job is already saved with new userId
    }

    // Note: We keep the job in the client's list too (if it was a client job)
    // This allows clients to still see their posted jobs
    // The tradie will see it because job.userId === tradieUserId

    // Send notification email to tradie (optional but ideal)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      
      const jobUrl = `${baseUrl}/jobs/${job.id}`;
      const suburb = job.address ? extractSuburb(job.address) : "location";
      
      await sendJobPackEmail({
        jobId: job.id,
        to: tradie.email,
        subject: `New client job assigned to you – ${job.title}`,
        html: `
          <h2>New Client Job Assigned</h2>
          <p>Hello ${tradie.tradingName || tradie.businessName || "there"},</p>
          <p>A new client job has been assigned to you:</p>
          <ul>
            <li><strong>Job:</strong> ${job.title}</li>
            <li><strong>Location:</strong> ${suburb}</li>
            <li><strong>Trade Type:</strong> ${job.tradeType}</li>
            <li><strong>Property Type:</strong> ${job.propertyType}</li>
          </ul>
          <p><a href="${jobUrl}">View and quote this job →</a></p>
          <p>Please log in to review the job details and create a quote for the client.</p>
        `,
        text: `
New Client Job Assigned

Hello ${tradie.tradingName || tradie.businessName || "there"},

A new client job has been assigned to you:

Job: ${job.title}
Location: ${suburb}
Trade Type: ${job.tradeType}
Property Type: ${job.propertyType}

View and quote this job: ${jobUrl}

Please log in to review the job details and create a quote for the client.
        `,
      });
    } catch (emailError) {
      // Log but don't fail the assignment if email fails
      console.error("Failed to send assignment notification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        userId: job.userId,
        assignedByUserId: job.assignedByUserId,
        assignedAt: job.assignedAt,
        assignmentStatus: job.assignmentStatus,
      },
    });
  } catch (error) {
    console.error("Error assigning job:", error);
    return NextResponse.json(
      { error: "Failed to assign job" },
      { status: 500 }
    );
  }
}

/**
 * Helper to extract suburb from address string
 */
function extractSuburb(address: string): string {
  // Try to extract suburb (word before postcode, or common suburb patterns)
  const postcodeMatch = address.match(/\b(\d{4})\b/);
  if (postcodeMatch) {
    const beforePostcode = address.substring(0, address.indexOf(postcodeMatch[1])).trim();
    const words = beforePostcode.split(/[,\s]+/);
    if (words.length > 0) {
      return words[words.length - 1]; // Last word before postcode
    }
  }
  // Fallback: return first part of address or "location"
  const parts = address.split(",");
  return parts[0]?.trim() || "location";
}

