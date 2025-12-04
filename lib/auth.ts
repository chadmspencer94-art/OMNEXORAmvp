import { kv } from "./kv";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
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

const SESSION_COOKIE_NAME = "omx_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ============================================================================
// User Functions
// ============================================================================

/**
 * Creates a new user in KV storage
 * @param email - User's email address
 * @param password - Plain text password (will be hashed)
 * @returns The created user (without password hash)
 * @throws Error if user already exists
 */
export async function createUser(
  email: string,
  password: string
): Promise<SafeUser> {
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await kv.get<User>(`user:email:${normalizedEmail}`);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Generate user ID and hash password
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = new Date().toISOString();

  const user: User = {
    id,
    email: normalizedEmail,
    passwordHash,
    createdAt,
  };

  // Store user by email and by id
  await kv.set(`user:email:${normalizedEmail}`, user);
  await kv.set(`user:id:${id}`, user);

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

  // Load user by email
  const user = await kv.get<User>(`user:email:${normalizedEmail}`);
  if (!user) {
    return null;
  }

  // Compare password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Return safe user without password hash
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
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

  // Load user by id
  const user = await kv.get<User>(`user:id:${session.userId}`);
  if (!user) {
    return null;
  }

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

// Export the cookie name for use in middleware
export { SESSION_COOKIE_NAME };

