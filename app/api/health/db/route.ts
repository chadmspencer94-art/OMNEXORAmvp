import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health/db
 * Database health check endpoint
 * Verifies Prisma can connect and execute a simple query
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    const prisma = getPrisma();
    
    // Execute a simple query to verify connection
    await prisma.$queryRaw`SELECT 1 as connected`;
    
    const latencyMs = Date.now() - startTime;
    
    return NextResponse.json({
      ok: true,
      database: "connected",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    
    // Don't expose internal details in production
    const safeMessage = process.env.NODE_ENV === "production"
      ? "Database connection failed"
      : errorMessage;
    
    console.error("[health/db] Database health check failed:", errorMessage);
    
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: safeMessage,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
