import { NextRequest, NextResponse } from "next/server";

// CLIENT PORTAL IS DISABLED
// All client API endpoints return 403 Forbidden

/**
 * POST /api/client/jobs/[id]/decline
 * CLIENT PORTAL DISABLED - Returns 403 Forbidden
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Client portal is not available. This feature is disabled." },
    { status: 403 }
  );
}
