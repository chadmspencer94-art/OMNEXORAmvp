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
 * Uses POSTGRES_PRISMA_URL (Neon pooled) first, falls back to POSTGRES_URL,
 * then DATABASE_URL for local SQLite development.
 */
export function getPrisma(): PrismaClient {
  const datasourceUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error(
      "Database configuration error: missing POSTGRES_PRISMA_URL, POSTGRES_URL, or DATABASE_URL"
    );
  }

  if (process.env.NODE_ENV === "production") {
    return new PrismaClient({ datasourceUrl, log: ["error"] });
  }

  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasourceUrl,
      log: ["query", "error", "warn"],
    });
  }

  return global.__prisma;
}

/**
 * Backward-compatible export using a Proxy.
 * The actual client is only created when a property is accessed (lazy).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

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
