import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createFeedback, isValidCategory } from "@/lib/feedback";

interface FeedbackRequestBody {
  message: string;
  category?: string;
  jobId?: string | null;
}

export async function POST(request: Request) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in to submit feedback." },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json()) as FeedbackRequestBody;
    const { message, category, jobId } = body;

    // Validate message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Feedback message is required" },
        { status: 400 }
      );
    }

    // Validate message length (reasonable limit)
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: "Feedback message is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Validate category if provided
    const validatedCategory = category && isValidCategory(category) ? category : "other";

    // Create feedback
    const feedback = await createFeedback({
      userId: user.id,
      userEmail: user.email,
      message: trimmedMessage,
      category: validatedCategory,
      jobId: jobId || null,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." },
      { status: 500 }
    );
  }
}

