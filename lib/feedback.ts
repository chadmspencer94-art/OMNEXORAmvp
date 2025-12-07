/**
 * Feedback system for OMNEXORA
 * 
 * Allows users to submit feedback and admins to review it.
 */

import { kv } from "./kv";

// ============================================================================
// Types
// ============================================================================

export type FeedbackCategory = "bug" | "idea" | "question" | "other";
export type FeedbackStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  updatedAt?: string;
  jobId?: string | null;
  category: FeedbackCategory;
  message: string; // Initial message (for backwards compatibility)
  status: FeedbackStatus; // New: ticket status
  assignedAdminId?: string | null; // New: assigned admin
  resolved: boolean; // Legacy: kept for backwards compatibility
  resolvedAt?: string | null;
}

export interface FeedbackMessage {
  id: string;
  feedbackId: string;
  authorUserId?: string | null; // Set if message from user
  authorAdminId?: string | null; // Set if from admin/support
  authorEmail?: string; // Email of author (for display)
  authorName?: string; // Name of author (for display)
  message: string;
  createdAt: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

const FEEDBACK_PREFIX = "feedback:";
const FEEDBACK_INDEX_KEY = "feedback:index";
const FEEDBACK_MESSAGE_PREFIX = "feedback:message:";
const FEEDBACK_MESSAGES_INDEX_PREFIX = "feedback:messages:";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generates a unique ID for feedback
 */
function generateFeedbackId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates the feedback category
 */
export function isValidCategory(category: string): category is FeedbackCategory {
  return ["bug", "idea", "question", "other"].includes(category);
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Creates a new feedback entry
 */
export async function createFeedback(data: {
  userId: string;
  userEmail: string;
  message: string;
  category?: string;
  jobId?: string | null;
}): Promise<Feedback> {
  const id = generateFeedbackId();
  const now = new Date().toISOString();

  const feedback: Feedback = {
    id,
    userId: data.userId,
    userEmail: data.userEmail,
    createdAt: now,
    updatedAt: now,
    jobId: data.jobId || null,
    category: data.category && isValidCategory(data.category) ? data.category : "other",
    message: data.message.trim(),
    status: "OPEN",
    assignedAdminId: null,
    resolved: false,
    resolvedAt: null,
  };

  // Save feedback entry
  await kv.set(`${FEEDBACK_PREFIX}${id}`, feedback);

  // Add to index list (prepend so newest is first)
  await kv.lpush(FEEDBACK_INDEX_KEY, id);

  console.log(`[FEEDBACK] New feedback ${id} from ${data.userEmail}`);

  return feedback;
}

/**
 * Gets a feedback entry by ID
 */
export async function getFeedbackById(id: string): Promise<Feedback | null> {
  return await kv.get<Feedback>(`${FEEDBACK_PREFIX}${id}`);
}

/**
 * Gets all feedback entries (sorted by createdAt desc, newest first)
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  // Get all feedback IDs from index
  const ids = await kv.lrange<string>(FEEDBACK_INDEX_KEY, 0, -1);

  if (!ids || ids.length === 0) {
    return [];
  }

  // Fetch all feedback entries
  const feedbackEntries: Feedback[] = [];
  for (const id of ids) {
    const entry = await kv.get<Feedback>(`${FEEDBACK_PREFIX}${id}`);
    if (entry) {
      feedbackEntries.push(entry);
    }
  }

  // Sort by createdAt descending (newest first)
  feedbackEntries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return feedbackEntries;
}

/**
 * Gets count of unresolved feedback
 */
export async function getUnresolvedFeedbackCount(): Promise<number> {
  const allFeedback = await getAllFeedback();
  return allFeedback.filter((f) => !f.resolved).length;
}

/**
 * Updates feedback resolution status
 */
export async function updateFeedbackResolution(
  id: string,
  resolved: boolean
): Promise<Feedback | null> {
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return null;
  }

  feedback.resolved = resolved;
  feedback.resolvedAt = resolved ? new Date().toISOString() : null;
  feedback.status = resolved ? "RESOLVED" : (feedback.status === "RESOLVED" ? "OPEN" : feedback.status);
  feedback.updatedAt = new Date().toISOString();

  await kv.set(`${FEEDBACK_PREFIX}${id}`, feedback);

  console.log(`[FEEDBACK] Feedback ${id} marked as ${resolved ? "resolved" : "unresolved"}`);

  return feedback;
}

/**
 * Updates feedback status
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  assignedAdminId?: string | null
): Promise<Feedback | null> {
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return null;
  }

  feedback.status = status;
  if (assignedAdminId !== undefined) {
    feedback.assignedAdminId = assignedAdminId;
  }
  feedback.updatedAt = new Date().toISOString();
  
  // Update resolved flag for backwards compatibility
  if (status === "RESOLVED" && !feedback.resolvedAt) {
    feedback.resolved = true;
    feedback.resolvedAt = new Date().toISOString();
  } else if (status !== "RESOLVED") {
    feedback.resolved = false;
    feedback.resolvedAt = null;
  }

  await kv.set(`${FEEDBACK_PREFIX}${id}`, feedback);

  return feedback;
}

/**
 * Creates a feedback message (reply)
 */
export async function createFeedbackMessage(data: {
  feedbackId: string;
  authorUserId?: string | null;
  authorAdminId?: string | null;
  authorEmail: string;
  authorName?: string;
  message: string;
}): Promise<FeedbackMessage> {
  const id = `${data.feedbackId}_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const feedbackMessage: FeedbackMessage = {
    id,
    feedbackId: data.feedbackId,
    authorUserId: data.authorUserId ?? null,
    authorAdminId: data.authorAdminId ?? null,
    authorEmail: data.authorEmail,
    authorName: data.authorName,
    message: data.message.trim(),
    createdAt: now,
  };

  // Save message
  await kv.set(`${FEEDBACK_MESSAGE_PREFIX}${id}`, feedbackMessage);

  // Add to feedback's message index
  await kv.lpush(`${FEEDBACK_MESSAGES_INDEX_PREFIX}${data.feedbackId}`, id);

  // Update feedback's updatedAt timestamp
  const feedback = await getFeedbackById(data.feedbackId);
  if (feedback) {
    feedback.updatedAt = now;
    // If admin replied, mark as IN_PROGRESS if still OPEN
    if (data.authorAdminId && feedback.status === "OPEN") {
      feedback.status = "IN_PROGRESS";
      if (!feedback.assignedAdminId) {
        feedback.assignedAdminId = data.authorAdminId;
      }
    }
    await kv.set(`${FEEDBACK_PREFIX}${data.feedbackId}`, feedback);
  }

  console.log(`[FEEDBACK] Message ${id} added to feedback ${data.feedbackId} by ${data.authorEmail}`);

  return feedbackMessage;
}

/**
 * Gets all messages for a feedback ticket
 */
export async function getFeedbackMessages(feedbackId: string): Promise<FeedbackMessage[]> {
  const ids = await kv.lrange<string>(`${FEEDBACK_MESSAGES_INDEX_PREFIX}${feedbackId}`, 0, -1);

  if (!ids || ids.length === 0) {
    return [];
  }

  // Fetch all messages in parallel
  const messages = await Promise.all(
    ids.map((id) => kv.get<FeedbackMessage>(`${FEEDBACK_MESSAGE_PREFIX}${id}`))
  );

  // Filter out nulls and sort by createdAt ascending (oldest first)
  return messages
    .filter((msg): msg is FeedbackMessage => msg !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

