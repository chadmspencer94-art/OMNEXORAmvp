import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
}

/**
 * POST /api/admin/notifications
 * Send a notification to all users or users of a specific role (admin only)
 *
 * Body:
 * - title: string
 * - message: string
 * - targetRole?: string (e.g., "tradie", "builder", "client", "all")
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, targetRole } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    let userIds: string[] = [];
    
    try {
      if (targetRole && targetRole !== "all") {
        // Fetch users by role
        const users = await prisma.$queryRaw<UserRow[]>`
          SELECT id FROM users WHERE role = ${targetRole}
        `;
        userIds = users.map((user) => user.id);
      } else {
        // Fetch all users
        const users = await prisma.$queryRaw<UserRow[]>`
          SELECT id FROM users
        `;
        userIds = users.map((user) => user.id);
      }

      if (userIds.length === 0) {
        return NextResponse.json(
          { success: true, message: "No users found to send notification to.", count: 0 },
          { status: 200 }
        );
      }

      const now = new Date().toISOString();
      const actorName = currentUser.name || currentUser.email;
      
      // Insert notifications for each user one by one
      let insertedCount = 0;
      for (const userId of userIds) {
        const notificationId = randomUUID();
        await prisma.$executeRaw`
          INSERT INTO notifications (id, "userId", type, title, message, "actorId", "actorName", read, "createdAt", "updatedAt")
          VALUES (${notificationId}, ${userId}, 'ADMIN_ANNOUNCEMENT', ${title}, ${message}, ${currentUser.id}, ${actorName}, 0, ${now}, ${now})
        `;
        insertedCount++;
      }

      return NextResponse.json({ success: true, count: insertedCount });
    } catch (dbError: any) {
      console.error("[admin-notifications] Database error:", dbError);
      
      // If the table doesn't exist
      if (dbError?.message?.includes("no such table") || dbError?.message?.includes("notifications")) {
        return NextResponse.json(
          { error: "Notifications table not found. Please run database migrations." },
          { status: 500 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[admin-notifications] Error sending notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/notifications
 * Get list of sent admin notifications (for future admin notification history)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const prisma = getPrisma();

    try {
      // Get unique admin announcements (distinct by title, message, createdAt)
      const announcements = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT title, message, "actorName", "createdAt", COUNT(*) as recipientCount
        FROM notifications
        WHERE type = 'ADMIN_ANNOUNCEMENT'
        GROUP BY title, message, "actorName", "createdAt"
        ORDER BY "createdAt" DESC
        LIMIT 50
      `;

      return NextResponse.json({ announcements });
    } catch (dbError: any) {
      if (dbError?.message?.includes("no such table") || dbError?.message?.includes("notifications")) {
        return NextResponse.json({ announcements: [] });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[admin-notifications] Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
