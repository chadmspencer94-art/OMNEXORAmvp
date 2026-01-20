/**
 * Notification API Endpoints
 * 
 * GET /api/me/notifications - Get user's notifications
 * POST /api/me/notifications - Mark notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  jobId: string | null;
  documentId: string | null;
  read: number;
  readAt: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CountResult {
  count: number;
}

/**
 * GET /api/me/notifications
 * Fetch current user's notifications
 * 
 * Query params:
 * - unreadOnly: boolean (default: false) - Only return unread notifications
 * - limit: number (default: 20) - Max notifications to return
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const prisma = getPrisma();

    // Check if notifications table exists
    try {
      // Fetch notifications using raw SQL
      let notifications: NotificationRow[];
      if (unreadOnly) {
        notifications = await prisma.$queryRaw<NotificationRow[]>`
          SELECT * FROM notifications 
          WHERE "userId" = ${user.id} AND read = 0
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;
      } else {
        notifications = await prisma.$queryRaw<NotificationRow[]>`
          SELECT * FROM notifications 
          WHERE "userId" = ${user.id}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;
      }

      // Get unread count
      const unreadResult = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE "userId" = ${user.id} AND read = 0
      `;
      const unreadCount = Number(unreadResult[0]?.count || 0);

      // Transform results to match expected format
      const formattedNotifications = notifications.map(n => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        jobId: n.jobId,
        documentId: n.documentId,
        read: Boolean(n.read),
        readAt: n.readAt,
        actorId: n.actorId,
        actorName: n.actorName,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));

      return NextResponse.json({
        notifications: formattedNotifications,
        unreadCount,
      });
    } catch (dbError: any) {
      // If the table doesn't exist yet, return empty results
      if (dbError?.message?.includes("no such table") || dbError?.message?.includes("notifications")) {
        console.log("[notifications] Table not found, returning empty results");
        return NextResponse.json({
          notifications: [],
          unreadCount: 0,
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[notifications] Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/me/notifications
 * Mark notifications as read
 * 
 * Body:
 * - notificationIds: string[] - IDs of notifications to mark as read
 * - markAll: boolean - Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    const prisma = getPrisma();

    try {
      const now = new Date().toISOString();

      if (markAll) {
        // Mark all notifications as read
        await prisma.$executeRaw`
          UPDATE notifications 
          SET read = 1, "readAt" = ${now}
          WHERE "userId" = ${user.id} AND read = 0
        `;
      } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
        // Mark specific notifications as read
        // Build comma-separated list of IDs for SQL IN clause
        const idPlaceholders = notificationIds.map((id: string) => `'${id}'`).join(",");
        await prisma.$executeRawUnsafe(`
          UPDATE notifications 
          SET read = 1, "readAt" = '${now}'
          WHERE id IN (${idPlaceholders}) AND "userId" = '${user.id}'
        `);
      } else {
        return NextResponse.json(
          { error: "Invalid request - provide notificationIds or markAll" },
          { status: 400 }
        );
      }

      // Return updated unread count
      const unreadResult = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE "userId" = ${user.id} AND read = 0
      `;
      const unreadCount = Number(unreadResult[0]?.count || 0);

      return NextResponse.json({
        success: true,
        unreadCount,
      });
    } catch (dbError: any) {
      // If the table doesn't exist yet, return success with 0 unread
      if (dbError?.message?.includes("no such table") || dbError?.message?.includes("notifications")) {
        console.log("[notifications] Table not found, returning empty results");
        return NextResponse.json({
          success: true,
          unreadCount: 0,
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[notifications] Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
