import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Get the Prisma client instance (lazy initialization).
 *
 * This function creates/returns a singleton Prisma client only when called,
 * avoiding build-time errors when database env vars are not available.
 *
 * Supports both SQLite (DATABASE_URL) for local development and Postgres
 * (POSTGRES_PRISMA_URL or POSTGRES_URL) for production.
 * MUST be called inside request handlers only - never at module top level.
 */
export function getPrisma(): PrismaClient {
  // Check for SQLite first (local development), then Postgres (production)
  const datasourceUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

  if (!datasourceUrl) {
    throw new Error(
      "Database configuration error: missing DATABASE_URL (SQLite) or POSTGRES_URL/POSTGRES_PRISMA_URL (Postgres). Please set DATABASE_URL in .env.local for local development (e.g., file:./prisma/dev.db)"
    );
  }

  if (process.env.NODE_ENV === "production") {
    return new PrismaClient({ datasourceUrl });
  }

  if (!global.__prisma) {
    global.__prisma = new PrismaClient({ datasourceUrl });
  }

  return global.__prisma;
}

export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  fallbackError = "Database operation failed. Please try again."
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (err) {
    console.error("[prisma] Database query error:", err);
    return { data: null, error: fallbackError };
  }
}

export function isPrismaError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("prisma") ||
      message.includes("database") ||
      message.includes("sqlite") ||
      message.includes("postgresql") ||
      message.includes("connection") ||
      message.includes("p1") ||
      message.includes("p2") ||
      message.includes("environment variable not found")
    );
  }
  return false;
}

export function getSafeErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (isPrismaError(error)) {
    return "Service temporarily unavailable. Please try again shortly.";
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (
      !msg.includes("prisma") &&
      !msg.includes("schema.prisma") &&
      !msg.includes("DATABASE_URL") &&
      !msg.includes("POSTGRES") &&
      !msg.includes("at ") &&
      !msg.includes(".ts:") &&
      !msg.includes(".js:")
    ) {
      return msg;
    }
  }

  return fallback;
}
