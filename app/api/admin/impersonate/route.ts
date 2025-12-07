import { NextResponse } from "next/server";
import { getCurrentUser, getRealUserFromSession, startImpersonation, stopImpersonation, isAdmin, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { cookies } from "next/headers";

// POST - Start or stop impersonation
export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userId } = body;

    if (!action || !["start", "stop"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start' or 'stop'" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    if (action === "start") {
      if (!userId || typeof userId !== "string") {
        return NextResponse.json(
          { error: "User ID is required to start impersonation" },
          { status: 400 }
        );
      }

      // Start impersonation
      const session = await startImpersonation(sessionId, userId);

      if (!session) {
        return NextResponse.json(
          { error: "Failed to start impersonation" },
          { status: 500 }
        );
      }

      // Log audit
      await createAuditLog({
        adminId: adminUser.id,
        actingAsUserId: userId,
        action: "IMPERSONATE_START",
        metadata: { targetUserId: userId },
      });

      return NextResponse.json({
        success: true,
        message: "Impersonation started",
      });
    } else {
      // Stop impersonation
      const realAdmin = await getRealUserFromSession(sessionId);
      const session = await stopImpersonation(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: "Failed to stop impersonation" },
          { status: 500 }
        );
      }

      // Log audit if we were impersonating
      if (session.actingAsUserId && realAdmin) {
        await createAuditLog({
          adminId: realAdmin.id,
          actingAsUserId: session.actingAsUserId,
          action: "IMPERSONATE_END",
          metadata: { wasActingAsUserId: session.actingAsUserId },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Impersonation stopped",
      });
    }
  } catch (error) {
    console.error("Error with impersonation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

