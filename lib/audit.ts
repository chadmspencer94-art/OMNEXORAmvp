/**
 * Audit logging system for admin actions
 * Tracks impersonation and other critical admin operations
 */

import { kv } from "./kv";

// ============================================================================
// Types
// ============================================================================

export type AuditAction =
  | "IMPERSONATE_START"
  | "IMPERSONATE_END"
  | "JOB_CREATED_AS_USER"
  | "USER_UPDATED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "PLAN_UPDATED"
  | "FEEDBACK_REPLIED";

export interface AuditLog {
  id: string;
  adminId: string; // The admin performing the action
  actingAsUserId?: string | null; // If acting on behalf of a user
  action: AuditAction;
  metadata?: Record<string, any>; // Additional context
  createdAt: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

const AUDIT_PREFIX = "audit:";
const AUDIT_INDEX_KEY = "audit:index";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generates a unique ID for audit log
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Creates a new audit log entry
 */
export async function createAuditLog(data: {
  adminId: string;
  actingAsUserId?: string | null;
  action: AuditAction;
  metadata?: Record<string, any>;
}): Promise<AuditLog> {
  const id = generateAuditId();
  const now = new Date().toISOString();

  const auditLog: AuditLog = {
    id,
    adminId: data.adminId,
    actingAsUserId: data.actingAsUserId ?? null,
    action: data.action,
    metadata: data.metadata || {},
    createdAt: now,
  };

  // Save audit log
  await kv.set(`${AUDIT_PREFIX}${id}`, auditLog);

  // Add to index (prepend so newest is first)
  await kv.lpush(AUDIT_INDEX_KEY, id);

  console.log(`[AUDIT] ${data.action} by admin ${data.adminId}${data.actingAsUserId ? ` (acting as ${data.actingAsUserId})` : ""}`);

  return auditLog;
}

/**
 * Gets audit logs for a specific admin
 */
export async function getAuditLogsForAdmin(
  adminId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  // Get all audit log IDs from index
  const ids = await kv.lrange<string>(AUDIT_INDEX_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  // Fetch all audit logs in parallel
  const logs = await Promise.all(
    ids.map((id) => kv.get<AuditLog>(`${AUDIT_PREFIX}${id}`))
  );

  // Filter by admin, filter out nulls, and sort by createdAt descending
  return logs
    .filter((log): log is AuditLog => log !== null && log.adminId === adminId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Gets audit logs for a specific user (actions performed on behalf of this user)
 */
export async function getAuditLogsForUser(
  userId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  const ids = await kv.lrange<string>(AUDIT_INDEX_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  const logs = await Promise.all(
    ids.map((id) => kv.get<AuditLog>(`${AUDIT_PREFIX}${id}`))
  );

  // Filter by actingAsUserId
  return logs
    .filter((log): log is AuditLog => log !== null && log.actingAsUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

