import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Check if DATABASE_URL is configured.
 * In development, we use SQLite (file:./dev.db).
 * In production, this should be a PostgreSQL URL configured in Vercel.
 */
function validateDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    const isDev = process.env.NODE_ENV !== "production";
    
    if (isDev) {
      console.error(
        "[prisma] DATABASE_URL is not set. For local development with SQLite, add to your .env:\n" +
        "DATABASE_URL=\"file:./dev.db\"\n" +
        "Then run: npx prisma migrate dev"
      );
    } else {
      // In production, log a short message (avoid exposing internals)
      console.error("[prisma] DATABASE_URL environment variable is required");
    }
    
    throw new Error("Database configuration error");
  }
}

// Validate before creating the client
validateDatabaseUrl();

// Prisma 5.x reads DATABASE_URL from environment automatically
// The connection URL is configured in prisma/schema.prisma
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Safe database query wrapper that catches Prisma errors
 * and returns a user-friendly error message.
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  fallbackError = "Database operation failed. Please try again."
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (err) {
    // Log the real error server-side
    console.error("[prisma] Database query error:", err);
    
    // Return a generic error message to the client
    return { data: null, error: fallbackError };
  }
}

/**
 * Check if an error is a Prisma-related error (for filtering in catch blocks)
 */
export function isPrismaError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("prisma") ||
      message.includes("database") ||
      message.includes("sqlite") ||
      message.includes("postgresql") ||
      message.includes("connection") ||
      message.includes("p1") || // Prisma error codes like P1001, P1002
      message.includes("p2") ||
      message.includes("environment variable not found")
    );
  }
  return false;
}

/**
 * Get a user-friendly error message, filtering out Prisma internals
 */
export function getSafeErrorMessage(error: unknown, fallback = "An unexpected error occurred. Please try again."): string {
  if (isPrismaError(error)) {
    return "Service temporarily unavailable. Please try again shortly.";
  }
  
  if (error instanceof Error) {
    // Only return the message if it doesn't contain sensitive info
    const msg = error.message;
    if (
      !msg.includes("prisma") &&
      !msg.includes("schema.prisma") &&
      !msg.includes("DATABASE_URL") &&
      !msg.includes("at ") && // Stack trace indicator
      !msg.includes(".ts:") &&
      !msg.includes(".js:")
    ) {
      return msg;
    }
  }
  
  return fallback;
}

