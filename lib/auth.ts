import { kv } from "./kv";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ============================================================================
// Types
// ============================================================================

export type UserRole = "tradie" | "builder" | "client" | "supplier" | "admin";
export type VerificationStatus = "unverified" | "pending" | "verified";
// Legacy statuses for backwards compatibility (mapped in normalizeUser)
type LegacyVerificationStatus = "pending_review" | "rejected";

// Plan and billing types
export type PlanTier = "FREE" | "TRIAL" | "FOUNDER" | "PRO" | "BUSINESS";
export type PlanStatus = "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED";

export interface TradieBusinessDetails {
  businessName?: string;
  tradingName?: string;
  abn?: string;
  tradeTypes?: string[];
  serviceArea?: string;
  // Service area details (for admin filtering)
  serviceAreaCity?: string;
  serviceAreaRadiusKm?: number;
  // Insurance and licence info (prototype fields)
  insuranceProvider?: string;
  insuranceExpiry?: string;
  licenceNumber?: string;
  // Legacy document URL fields (kept for backwards compatibility)
  businessDocUrl?: string;
  insuranceDocUrl?: string;
  licenceDocUrl?: string;
  // Verification timestamps and notes
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationRejectionReason?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  // Role and verification
  role: UserRole;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  isAdmin: boolean;
  // Business details (for tradies)
  businessDetails?: TradieBusinessDetails;
  // Pricing settings (for tradies)
  hourlyRate?: number | null;
  dayRate?: number | null;
  materialMarkupPercent?: number | null;
  roughEstimateOnly?: boolean | null;
  // Plan and billing (new fields)
  planTier?: PlanTier;
  planStatus?: PlanStatus;
  trialEndsAt?: string | null;
  // Account status and ban
  accountStatus?: "ACTIVE" | "SUSPENDED" | "BANNED";
  isBanned?: boolean;
  // Activity tracking (new fields)
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  totalJobs?: number;
  totalJobPacks?: number;
  // Admin notes (internal only)
  adminNotes?: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  // Impersonation support - if set, admin is acting as this user
  actingAsUserId?: string | null;
  realAdminId?: string | null; // Original admin ID for audit trail
}

// Safe user object without password hash
export type SafeUser = Omit<User, "passwordHash">;

// ============================================================================
// Constants
// ============================================================================

export const SESSION_COOKIE_NAME = "omx_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Cookie options for session cookies
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

// ============================================================================
// Admin Emails
// ============================================================================

/**
 * List of email addresses that have admin access.
 * Add emails here (lowercase) to grant admin privileges.
 */
const ADMIN_EMAILS: string[] = [
  "chadmspencer94@gmail.com",
  "sarahkison5@gmail.com",
  // Add more admin emails as needed
];

/**
 * Checks if a user has admin privileges.
 * Checks role="admin", the stored isAdmin flag, and the ADMIN_EMAILS list.
 * @param user - The user to check (SafeUser or User)
 * @returns True if the user is an admin
 */
export function isAdmin(user: SafeUser | null): boolean {
  if (!user) return false;
  // Check role first, then stored flag, then email list for backwards compatibility
  return user.role === "admin" || user.isAdmin === true || ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/**
 * Checks if a user is a client
 * @param user - The user to check
 * @returns true if user is a client, false otherwise
 */
export function isClient(user: SafeUser | null): boolean {
  if (!user) return false;
  return user.role === "client";
}

/**
 * Checks if a user is a trade/builder/business (not a client)
 * @param user - The user to check
 * @returns true if user is a trade/builder/business, false otherwise
 */
export function isTradeOrBusiness(user: SafeUser | null): boolean {
  if (!user) return false;
  return user.role === "tradie" || user.role === "builder" || user.role === "supplier" || user.role === "admin";
}

// ============================================================================
// Test Verified Emails
// ============================================================================

/**
 * List of email addresses that should be automatically verified on registration.
 * Used for testing and development purposes.
 */
const TEST_VERIFIED_EMAILS: string[] = [
  "chadmspencer94@gmail.com_1",
  "chadmspencer94@gmail.com_2",
  // Add more test emails here (lowercase)
];

// ============================================================================
// User Functions
// ============================================================================

/**
 * The primary admin email that is always verified and has admin access.
 */
const PRIMARY_ADMIN_EMAIL = "chadmspencer94@gmail.com";

/**
 * Normalizes a user object loaded from KV storage to ensure all fields are present.
 * Handles older user records that may be missing newer fields like verificationStatus.
 * Also enforces admin privileges and verified status for the primary admin email.
 */
function normalizeUser(rawUser: Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }): User {
  const email = rawUser.email.toLowerCase();
  const isPrimaryAdmin = email === PRIMARY_ADMIN_EMAIL;
  const isAdminEmail = ADMIN_EMAILS.includes(email);
  const isAnyAdmin = isPrimaryAdmin || isAdminEmail;
  
  // Normalize role - handle legacy roles and ensure valid role
  // FORCE primary admin and admin emails to always have "admin" role
  let role: UserRole = isAnyAdmin ? "admin" : (rawUser.role || "tradie");
  // Map legacy roles if needed (backwards compatibility)
  if (role !== "tradie" && role !== "builder" && role !== "client" && role !== "supplier" && role !== "admin") {
    role = "tradie"; // Default fallback
  }
  
  // If role is "admin", user is automatically an admin
  const isAdminFromRole = role === "admin";
  
  // For primary admin and admin emails, force isAdmin=true, role="admin", and verificationStatus="verified"
  const isAdminFlag = isAnyAdmin || isAdminFromRole ? true : (rawUser.isAdmin ?? false);
  
  // Normalize verification status - map legacy statuses
  // Admins are automatically verified (no business verification needed)
  let verificationStatus: VerificationStatus;
  const rawStatus = rawUser.verificationStatus as VerificationStatus | LegacyVerificationStatus | undefined;
  if (isAnyAdmin) {
    verificationStatus = "verified";
  } else if (!rawStatus) {
    verificationStatus = "unverified";
  } else if (rawStatus === "pending_review" || rawStatus === "pending") {
    verificationStatus = "pending";
  } else if (rawStatus === "rejected") {
    verificationStatus = "unverified"; // Map rejected back to unverified
  } else if (rawStatus === "verified") {
    verificationStatus = "verified";
  } else {
    verificationStatus = "unverified"; // Default fallback
  }
  
  const verifiedAt = isAnyAdmin 
    ? (rawUser.verifiedAt || new Date().toISOString())
    : (rawUser.verifiedAt ?? null);
  
  return {
    id: rawUser.id,
    email: rawUser.email,
    passwordHash: rawUser.passwordHash,
    createdAt: rawUser.createdAt,
    role,
    verificationStatus,
    verifiedAt,
    isAdmin: isAdminFlag,
    businessDetails: rawUser.businessDetails,
    // Pricing settings (preserve existing values, no defaults here - handled in UI)
    hourlyRate: rawUser.hourlyRate ?? null,
    dayRate: rawUser.dayRate ?? null,
    materialMarkupPercent: rawUser.materialMarkupPercent ?? null,
    roughEstimateOnly: rawUser.roughEstimateOnly ?? null,
    // Plan and billing (defaults for new fields)
    planTier: rawUser.planTier ?? "FREE",
    planStatus: rawUser.planStatus ?? "TRIAL",
    trialEndsAt: rawUser.trialEndsAt ?? null,
    // Account status and ban (defaults)
    accountStatus: rawUser.accountStatus ?? (rawUser.isBanned ? "BANNED" : "ACTIVE"),
    isBanned: rawUser.isBanned ?? false,
    // Activity tracking (defaults)
    lastLoginAt: rawUser.lastLoginAt ?? null,
    lastActivityAt: rawUser.lastActivityAt ?? null,
    totalJobs: rawUser.totalJobs ?? 0,
    totalJobPacks: rawUser.totalJobPacks ?? 0,
    // Admin notes
    adminNotes: rawUser.adminNotes,
  };
}

/**
 * Creates a new user in KV storage
 * @param email - User's email address
 * @param password - Plain text password (will be hashed)
 * @param role - User role (tradie or client), defaults to "tradie"
 * @returns The created user (without password hash)
 * @throws Error if user already exists
 */
export async function createUser(
  email: string,
  password: string,
  role: UserRole = "tradie"
): Promise<SafeUser> {
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();

  // Generate user ID and hash password
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = new Date().toISOString();

  // Check if this is the primary admin or a test verified email
  const isPrimaryAdmin = normalizedEmail === PRIMARY_ADMIN_EMAIL;
  const isTestVerified = TEST_VERIFIED_EMAILS.includes(normalizedEmail);
  
  // FORCE primary admin to always have "admin" role, verified status, and admin flag
  const finalRole: UserRole = isPrimaryAdmin ? "admin" : role;
  const verificationStatus: VerificationStatus = (isPrimaryAdmin || isTestVerified)
    ? "verified"
    : "unverified";
  const verifiedAt = (isPrimaryAdmin || isTestVerified) ? createdAt : null;
  const isAdminFlag = isPrimaryAdmin || ADMIN_EMAILS.includes(normalizedEmail);

  const user: User = {
    id,
    email: normalizedEmail,
    passwordHash,
    createdAt,
    role: finalRole,
    verificationStatus,
    verifiedAt,
    isAdmin: isAdminFlag,
    // Default plan for new users
    planTier: "FREE",
    planStatus: "TRIAL",
    trialEndsAt: null,
    // Initialize activity tracking
    lastLoginAt: null,
    lastActivityAt: null,
    totalJobs: 0,
    totalJobPacks: 0,
  };

  // Atomically set user by email only if it doesn't exist (prevents race condition)
  // The 'nx' option makes this an atomic check-and-set operation
  const wasSet = await kv.set(`user:email:${normalizedEmail}`, user, { nx: true });
  
  if (!wasSet) {
    throw new Error("User already exists");
  }

  // Store user by id - rollback email entry if this fails
  try {
    await kv.set(`user:id:${id}`, user);
    // Add to users index for admin listing
    await kv.lpush("users:all", id);
  } catch (error) {
    // Rollback: delete the email entry to maintain consistency
    await kv.del(`user:email:${normalizedEmail}`);
    throw error;
  }

  // Return safe user without password hash
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Verifies a user's credentials
 * @param email - User's email address
 * @param password - Plain text password to verify
 * @returns The user if credentials are valid, null otherwise
 */
export async function verifyUser(
  email: string,
  password: string
): Promise<SafeUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Load user by email (may be an older record missing newer fields)
  const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:email:${normalizedEmail}`);
  if (!rawUser) {
    return null;
  }

  // Compare password
  const isValid = await bcrypt.compare(password, rawUser.passwordHash);
  if (!isValid) {
    return null;
  }

  // Normalize to ensure all fields are present (handles older records)
  const user = normalizeUser(rawUser);

  // Return safe user without password hash
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Gets a user by ID (internal use - includes password hash)
 * @param userId - The user's ID
 * @returns The full user object or null
 */
export async function getUserById(userId: string): Promise<User | null> {
  const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:id:${userId}`);
  if (!rawUser) return null;
  
  // Normalize to ensure all fields are present (handles older records)
  return normalizeUser(rawUser);
}

/**
 * Gets a safe user by ID (no password hash)
 * @param userId - The user's ID
 * @returns The safe user object or null
 */
export async function getSafeUserById(userId: string): Promise<SafeUser | null> {
  const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:id:${userId}`);
  if (!rawUser) return null;
  
  // Normalize to ensure all fields are present (handles older records)
  const user = normalizeUser(rawUser);
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Updates a user's data in KV storage
 * @param userId - The user's ID
 * @param updates - Partial user data to update
 * @returns The updated safe user or null if user not found
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id" | "email" | "passwordHash" | "createdAt">>
): Promise<SafeUser | null> {
  const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:id:${userId}`);
  if (!rawUser) return null;

  // Normalize to ensure all fields are present (handles older records)
  const user = normalizeUser(rawUser);

  const updatedUser: User = {
    ...user,
    ...updates,
  };

  // If role is being updated to "admin", ensure isAdmin is true and auto-verify
  if (updates.role === "admin") {
    updatedUser.isAdmin = true;
    // Admins don't need business verification - auto-verify them
    if (!updatedUser.verificationStatus || updatedUser.verificationStatus !== "verified") {
      updatedUser.verificationStatus = "verified";
      if (!updatedUser.verifiedAt) {
        updatedUser.verifiedAt = new Date().toISOString();
      }
    }
  }
  
  // If isAdmin is being set to true, also ensure role is "admin" and auto-verify
  if (updates.isAdmin === true) {
    updatedUser.role = "admin";
    updatedUser.isAdmin = true;
    // Admins don't need business verification - auto-verify them
    if (!updatedUser.verificationStatus || updatedUser.verificationStatus !== "verified") {
      updatedUser.verificationStatus = "verified";
      if (!updatedUser.verifiedAt) {
        updatedUser.verifiedAt = new Date().toISOString();
      }
    }
  }
  
  // If isAdmin is being set to false, reset role to "tradie" (default non-admin role)
  if (updates.isAdmin === false) {
    updatedUser.isAdmin = false;
    // Only reset role if it was "admin" (preserve other roles like "builder", "supplier", etc.)
    if (updatedUser.role === "admin") {
      updatedUser.role = "tradie";
    }
  }

  // Update both user:id and user:email entries
  await kv.set(`user:id:${userId}`, updatedUser);
  await kv.set(`user:email:${user.email}`, updatedUser);

  const { passwordHash: _, ...safeUser } = updatedUser;
  return safeUser;
}

/**
 * Gets all users with a specific verification status (for admin)
 * Note: This is a simple implementation - in production, use proper indexing
 */
export async function getUsersByVerificationStatus(
  status: VerificationStatus
): Promise<SafeUser[]> {
  // This is a simplified implementation
  // In a real app, you'd maintain an index or use a proper database
  // For now, we'll store a list of user IDs that need review
  const userIds = await kv.lrange<string>(`admin:verification:${status}`, 0, -1) || [];
  
  // Also check legacy "pending_review" status if looking for "pending"
  let legacyUserIds: string[] = [];
  if (status === "pending") {
    legacyUserIds = await kv.lrange<string>(`admin:verification:pending_review`, 0, -1) || [];
  }
  
  // Combine and deduplicate
  const allUserIds = [...new Set([...userIds, ...legacyUserIds])];
  
  const users: SafeUser[] = [];
  for (const id of allUserIds) {
    const user = await getSafeUserById(id);
    if (user) {
      // Normalize status - map "pending_review" to "pending" for comparison
      const userStatusStr = user.verificationStatus as string;
      const normalizedStatus = userStatusStr === "pending_review" ? "pending" : user.verificationStatus;
      if (normalizedStatus === status) {
        users.push(user);
      }
    }
  }
  
  return users;
}

/**
 * Adds a user to a verification status index (for admin tracking)
 */
export async function addUserToVerificationIndex(
  userId: string,
  status: VerificationStatus
): Promise<void> {
  await kv.lpush(`admin:verification:${status}`, userId);
}

/**
 * Removes a user from a verification status index
 */
export async function removeUserFromVerificationIndex(
  userId: string,
  status: VerificationStatus
): Promise<void> {
  await kv.lrem(`admin:verification:${status}`, 0, userId);
}

/**
 * Gets all users in the system (for admin)
 * Uses an index list maintained in KV. If index doesn't exist, returns empty array.
 * 
 * IMPORTANT: This relies on the "users:all" index being maintained.
 * - New users are automatically added to the index in createUser()
 * - If you need to rebuild the index (e.g., for legacy users), you'll need to:
 *   1. Scan all user:email:* keys OR user:id:* keys (if possible in your KV setup)
 *   2. Add their IDs to the "users:all" list
 * 
 * Note: This is a simplified implementation - in production, use proper indexing or a database
 */
export async function getAllUsers(): Promise<SafeUser[]> {
  // Get all user IDs from the index
  // This index is maintained automatically when users are created via createUser()
  const userIds = await kv.lrange<string>("users:all", 0, -1) || [];
  
  if (userIds.length === 0) {
    // Index might be empty - could mean no users, or index not initialized
    // In production, you might want to log this or rebuild the index
    return [];
  }
  
  // Load all users in parallel
  const users = await Promise.all(
    userIds.map((id) => getSafeUserById(id))
  );
  
  // Filter out nulls (users that were deleted or don't exist anymore)
  // and sort by createdAt descending (newest first)
  return users
    .filter((user): user is SafeUser => user !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================================
// Session Functions
// ============================================================================

/**
 * Creates a new session for a user
 * @param userId - The user's ID
 * @returns The session ID
 */
export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const session: Session = {
    id: sessionId,
    userId,
    createdAt,
  };

  // Store session with TTL
  await kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL_SECONDS });

  return sessionId;
}

/**
 * Gets a user from a session ID
 * Supports impersonation: if actingAsUserId is set, returns that user instead
 * @param sessionId - The session ID
 * @returns The user if session is valid, null otherwise
 */
export async function getUserFromSession(
  sessionId: string
): Promise<SafeUser | null> {
  try {
    // Look up session
    const session = await kv.get<Session>(`session:${sessionId}`);
    if (!session) {
      return null;
    }

    // If impersonating, return the impersonated user
    const targetUserId = session.actingAsUserId || session.userId;

    // Load user by id (may be an older record missing newer fields)
    const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:id:${targetUserId}`);
    if (!rawUser) {
      console.error("[auth] getUserFromSession: user not found for session", sessionId, "targetUserId:", targetUserId);
      return null;
    }

    // Normalize to ensure all fields are present (handles older records)
    const user = normalizeUser(rawUser);

    // Return safe user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    // If KV lookup fails, return null (session invalid)
    console.error("[auth] Error getting user from session:", error);
    return null;
  }
}

/**
 * Gets the real admin user (not impersonated) from a session
 * Used for audit logging when impersonating
 * @param sessionId - The session ID
 * @returns The real admin user or null
 */
export async function getRealUserFromSession(
  sessionId: string
): Promise<SafeUser | null> {
  const session = await kv.get<Session>(`session:${sessionId}`);
  if (!session) {
    return null;
  }

  // Always return the real user (not the impersonated one)
  const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:id:${session.userId}`);
  if (!rawUser) {
    return null;
  }

  const user = normalizeUser(rawUser);
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Deletes a session
 * @param sessionId - The session ID to delete
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await kv.del(`session:${sessionId}`);
}

// ============================================================================
// Cookie Helpers
// ============================================================================

/**
 * Gets the current logged-in user from the session cookie
 * Supports impersonation - returns the impersonated user if active
 * @returns The current user or null if not logged in
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    const user = await getUserFromSession(sessionId);
    if (user) {
      console.log("[auth] getCurrentUser: found user", user.id);
    }
    return user;
  } catch (error: any) {
    // Handle DYNAMIC_SERVER_USAGE errors silently (expected during build/static generation)
    // These occur when Next.js tries to statically generate pages that use cookies()
    // Swallow these errors and just treat as "no user" - do NOT log them
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      (error as any).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      return null;
    }
    
    if (error?.message?.includes("Dynamic server usage") || error?.message?.includes("couldn't be rendered statically")) {
      return null;
    }
    
    // For other errors (e.g., KV unavailable), log but don't crash
    // This allows the app to continue functioning in degraded mode
    console.error("[auth] Failed to get current user from session", error);
    return null;
  }
}

/**
 * Checks if the current session is impersonating another user
 * @returns true if impersonating, false otherwise
 */
export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return false;
  }

  const session = await kv.get<Session>(`session:${sessionId}`);
  return !!(session?.actingAsUserId);
}

/**
 * Server-side helper to assert admin privileges
 * Throws an error if user is not an admin/support
 * @param user - The user to check
 * @throws Error if user is not admin
 */
export function assertAdmin(user: SafeUser | null): void {
  if (!user || !isAdmin(user)) {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * Requires an active (non-suspended) user
 * Redirects to login if not authenticated, or to account-suspended if suspended
 * @param redirectTo - Optional redirect path to append to login redirect
 * @returns The active user (never null, redirects if issues)
 */
export async function requireActiveUser(redirectTo?: string): Promise<SafeUser> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("[auth] requireActiveUser: no user found, redirecting to login");
      const { redirect } = await import("next/navigation");
      const loginPath = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}&reason=unauthorised` : "/login?reason=unauthorised";
      redirect(loginPath);
      // redirect() never returns, but TypeScript doesn't know that
      // Use a type assertion to satisfy TypeScript - this code will never execute
      return null as never;
    }

    console.log("[auth] requireActiveUser: user found", user.id);

    // Check if account is suspended (planStatus can be a string, not just PlanStatus enum)
    // SUSPENDED is a valid status that can be set by admins, even though it's not in the PlanStatus type
    const planStatus = user.planStatus as string | undefined;
    if (planStatus === "SUSPENDED") {
      console.log("[auth] requireActiveUser: account suspended, redirecting");
      const { redirect } = await import("next/navigation");
      redirect("/account-suspended");
      // redirect() never returns, but TypeScript doesn't know that
      return null as never;
    }

    // At this point, user is guaranteed to be non-null and not suspended
    return user;
  } catch (error) {
    // If getCurrentUser throws (shouldn't happen, but be defensive), log and redirect
    console.error("[auth] requireActiveUser: error getting user", error);
    const { redirect } = await import("next/navigation");
    redirect("/login?reason=unauthorised");
    return null as never;
  }
}

/**
 * Requires a client user
 * Redirects to login if not authenticated, or to /client/dashboard if not a client
 * @param redirectTo - Optional redirect path to append to login redirect
 * @returns The client user (never null, redirects if issues)
 */
export async function requireClientUser(redirectTo?: string): Promise<SafeUser> {
  const user = await requireActiveUser(redirectTo);
  
  if (!isClient(user)) {
    const { redirect } = await import("next/navigation");
    // Non-clients should go to their dashboard
    redirect("/dashboard");
    // redirect() never returns, but TypeScript doesn't know that
    return null as never;
  }

  return user;
}

/**
 * Requires a tradie/business/admin user (not a client)
 * Redirects to login if not authenticated, or to /client/dashboard if client
 * @param redirectTo - Optional redirect path to append to login redirect
 * @returns The tradie/business/admin user (never null, redirects if issues)
 */
export async function requireTradieUser(redirectTo?: string): Promise<SafeUser> {
  const user = await requireActiveUser(redirectTo);
  
  if (isClient(user)) {
    const { redirect } = await import("next/navigation");
    // Clients should go to their dashboard
    redirect("/client/dashboard");
    // redirect() never returns, but TypeScript doesn't know that
    return null as never;
  }

  return user;
}

/**
 * Sets the session cookie
 * @param sessionId - The session ID to set in the cookie
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Starts impersonation - sets actingAsUserId in session
 * @param sessionId - The admin's session ID
 * @param targetUserId - The user ID to impersonate
 * @returns Updated session or null if failed
 */
export async function startImpersonation(
  sessionId: string,
  targetUserId: string
): Promise<Session | null> {
  const session = await kv.get<Session>(`session:${sessionId}`);
  if (!session) {
    return null;
  }

  // Verify the session belongs to an admin
  const adminUser = await getUserById(session.userId);
  if (!adminUser || !isAdmin(adminUser as SafeUser)) {
    return null;
  }

  // Update session with impersonation data
  const updatedSession: Session = {
    ...session,
    actingAsUserId: targetUserId,
    realAdminId: session.userId, // Store original admin ID
  };

  await kv.set(`session:${sessionId}`, updatedSession, { ex: SESSION_TTL_SECONDS });

  return updatedSession;
}

/**
 * Stops impersonation - clears actingAsUserId from session
 * @param sessionId - The admin's session ID
 * @returns Updated session or null if failed
 */
export async function stopImpersonation(sessionId: string): Promise<Session | null> {
  const session = await kv.get<Session>(`session:${sessionId}`);
  if (!session) {
    return null;
  }

  // Clear impersonation data
  const updatedSession: Session = {
    ...session,
    actingAsUserId: null,
    realAdminId: null,
  };

  await kv.set(`session:${sessionId}`, updatedSession, { ex: SESSION_TTL_SECONDS });

  return updatedSession;
}

/**
 * Updates user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await updateUser(userId, {
    lastLoginAt: new Date().toISOString(),
  });
}

/**
 * Updates user's last activity timestamp
 */
export async function updateLastActivity(userId: string): Promise<void> {
  await updateUser(userId, {
    lastActivityAt: new Date().toISOString(),
  });
}

/**
 * Increments user's job count
 */
export async function incrementUserJobCount(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) return;

  await updateUser(userId, {
    totalJobs: (user.totalJobs || 0) + 1,
    lastActivityAt: new Date().toISOString(),
  });
}

