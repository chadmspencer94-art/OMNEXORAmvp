import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { updateFeedbackResolution, getFeedbackById } from "@/lib/feedback";

interface UpdateFeedbackBody {
  feedbackId: string;
  resolved: boolean;
}

/**
 * PATCH /api/admin/feedback
 * Updates the resolution status of a feedback entry (admin only)
 */
export async function PATCH(request: Request) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Admin check
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized. Admin access required." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as UpdateFeedbackBody;
    const { feedbackId, resolved } = body;

    // Validate
    if (!feedbackId || typeof feedbackId !== "string") {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 }
      );
    }

    if (typeof resolved !== "boolean") {
      return NextResponse.json(
        { error: "resolved must be a boolean" },
        { status: 400 }
      );
    }

    // Check if feedback exists
    const existing = await getFeedbackById(feedbackId);
    if (!existing) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Update resolution status
    const updated = await updateFeedbackResolution(feedbackId, resolved);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update feedback" },
        { status: 500 }
      );
    }

    console.log(`[ADMIN] Feedback ${feedbackId} marked as ${resolved ? "resolved" : "unresolved"} by ${user.email}`);

    return NextResponse.json({
      success: true,
      feedback: updated,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

