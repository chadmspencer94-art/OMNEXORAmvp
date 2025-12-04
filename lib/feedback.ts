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

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  jobId?: string | null;
  category: FeedbackCategory;
  message: string;
  resolved: boolean;
  resolvedAt?: string | null;
}

// ============================================================================
// Storage Keys
// ============================================================================

const FEEDBACK_PREFIX = "feedback:";
const FEEDBACK_INDEX_KEY = "feedback:index";

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
    jobId: data.jobId || null,
    category: data.category && isValidCategory(data.category) ? data.category : "other",
    message: data.message.trim(),
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

  await kv.set(`${FEEDBACK_PREFIX}${id}`, feedback);

  console.log(`[FEEDBACK] Feedback ${id} marked as ${resolved ? "resolved" : "unresolved"}`);

  return feedback;
}

