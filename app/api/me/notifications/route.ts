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

    // Fetch notifications
    const notifications = await (prisma as any).notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get unread count
    const unreadCount = await (prisma as any).notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
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

    if (markAll) {
      // Mark all notifications as read
      await (prisma as any).notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await (prisma as any).notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request - provide notificationIds or markAll" },
        { status: 400 }
      );
    }

    // Return updated unread count
    const unreadCount = await (prisma as any).notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("[notifications] Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
