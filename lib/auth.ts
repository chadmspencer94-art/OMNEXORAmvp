import { kv } from "./kv";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ============================================================================
// Types
// ============================================================================

export type UserRole = "tradie" | "client";
export type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";

export interface TradieBusinessDetails {
  businessName?: string;
  tradingName?: string;
  abn?: string;
  tradeTypes?: string[];
  serviceArea?: string;
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
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
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
  // Add more admin emails as needed
];

/**
 * Checks if a user has admin privileges.
 * Checks both the stored isAdmin flag and the ADMIN_EMAILS list.
 * @param user - The user to check (SafeUser or User)
 * @returns True if the user is an admin
 */
export function isAdmin(user: SafeUser | null): boolean {
  if (!user) return false;
  // Check both the stored flag and the email list for backwards compatibility
  return user.isAdmin === true || ADMIN_EMAILS.includes(user.email.toLowerCase());
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
  
  // For the primary admin, force isAdmin=true and verificationStatus="verified"
  const isAdminFlag = isPrimaryAdmin ? true : (rawUser.isAdmin ?? false);
  const verificationStatus: VerificationStatus = isPrimaryAdmin 
    ? "verified" 
    : (rawUser.verificationStatus || "unverified");
  const verifiedAt = isPrimaryAdmin 
    ? (rawUser.verifiedAt || new Date().toISOString())
    : (rawUser.verifiedAt ?? null);
  
  return {
    id: rawUser.id,
    email: rawUser.email,
    passwordHash: rawUser.passwordHash,
    createdAt: rawUser.createdAt,
    role: rawUser.role || "tradie",
    verificationStatus,
    verifiedAt,
    isAdmin: isAdminFlag,
    businessDetails: rawUser.businessDetails,
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
  
  // Determine verification status and admin flag
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
    role,
    verificationStatus,
    verifiedAt,
    isAdmin: isAdminFlag,
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
  
  const users: SafeUser[] = [];
  for (const id of userIds) {
    const user = await getSafeUserById(id);
    if (user && user.verificationStatus === status) {
      users.push(user);
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
 * @param sessionId - The session ID
 * @returns The user if session is valid, null otherwise
 */
export async function getUserFromSession(
  sessionId: string
): Promise<SafeUser | null> {
  // Look up session
  const session = await kv.get<Session>(`session:${sessionId}`);
  if (!session) {
    return null;
  }

  // Load user by id (may be an older record missing newer fields)
  const rawUser = await kv.get<Partial<User> & { id: string; email: string; passwordHash: string; createdAt: string }>(`user:id:${session.userId}`);
  if (!rawUser) {
    return null;
  }

  // Normalize to ensure all fields are present (handles older records)
  const user = normalizeUser(rawUser);

  // Return safe user without password hash
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
 * @returns The current user or null if not logged in
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  return getUserFromSession(sessionId);
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

