import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobById, saveJob, type UpdateJobData, type TradeType } from "@/lib/jobs";

const VALID_TRADE_TYPES: TradeType[] = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];

/**
 * PATCH /api/jobs/[id] - Update a job's details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: UpdateJobData = {};

    // Validate and apply updates
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim() === "") {
        return NextResponse.json({ error: "Title must be a non-empty string" }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.tradeType !== undefined) {
      if (!VALID_TRADE_TYPES.includes(body.tradeType)) {
        return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
      }
      updates.tradeType = body.tradeType;
    }

    if (body.propertyType !== undefined) {
      if (typeof body.propertyType !== "string" || body.propertyType.trim() === "") {
        return NextResponse.json({ error: "Property type must be a non-empty string" }, { status: 400 });
      }
      updates.propertyType = body.propertyType.trim();
    }

    if (body.address !== undefined) {
      updates.address = typeof body.address === "string" ? body.address.trim() : undefined;
    }

    if (body.notes !== undefined) {
      updates.notes = typeof body.notes === "string" ? body.notes : undefined;
    }

    if (body.clientName !== undefined) {
      if (typeof body.clientName !== "string" || body.clientName.trim() === "") {
        return NextResponse.json({ error: "Client name must be a non-empty string" }, { status: 400 });
      }
      updates.clientName = body.clientName.trim();
    }

    if (body.clientEmail !== undefined) {
      if (typeof body.clientEmail !== "string" || body.clientEmail.trim() === "") {
        return NextResponse.json({ error: "Client email must be a non-empty string" }, { status: 400 });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.clientEmail.trim())) {
        return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
      }
      updates.clientEmail = body.clientEmail.trim().toLowerCase();
    }

    // Apply updates to job
    if (updates.title) job.title = updates.title;
    if (updates.tradeType) job.tradeType = updates.tradeType;
    if (updates.propertyType) job.propertyType = updates.propertyType;
    if (updates.address !== undefined) job.address = updates.address;
    if (updates.notes !== undefined) job.notes = updates.notes;
    if (updates.clientName !== undefined) job.clientName = updates.clientName;
    if (updates.clientEmail !== undefined) job.clientEmail = updates.clientEmail;

    // Link to Client CRM if client details are provided/updated (for tradie-created jobs only)
    const { isClient } = await import("@/lib/auth");
    const userIsClient = isClient(user);
    
    if (!userIsClient && (updates.clientName || updates.clientEmail)) {
      const finalClientName = updates.clientName || job.clientName;
      const finalClientEmail = updates.clientEmail || job.clientEmail;
      
      if (finalClientName && finalClientEmail) {
        try {
          const { findOrCreateClientForJob } = await import("@/lib/clientCrm");
          // Extract suburb from address if available
          const suburb = job.address ? extractSuburbFromAddress(job.address) : undefined;
          
          const { clientId } = await findOrCreateClientForJob({
            ownerUserId: user.id,
            name: finalClientName,
            email: finalClientEmail,
            suburb: suburb,
          });
          
          job.clientId = clientId;
        } catch (error) {
          // Log but don't fail job update if client linking fails
          console.error("Failed to link client to job:", error);
        }
      }
    }

    // Mark job as needing regeneration if it was previously complete
    if (job.status === "ai_complete") {
      job.status = "pending_regeneration";
    }

    await saveJob(job);

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

/**
 * GET /api/jobs/[id] - Get a job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
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

