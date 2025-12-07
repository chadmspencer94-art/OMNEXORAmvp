import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin, getSafeUserById } from "@/lib/auth";
import { getFeedbackMessages } from "@/lib/feedback";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const messages = await getFeedbackMessages(id);

    // Enhance messages with user role info for admin badge display
    const messagesWithRoles = await Promise.all(
      messages.map(async (msg) => {
        let authorRole = null;
        let authorIsAdmin = false;

        if (msg.authorAdminId) {
          // This is an admin message
          const adminUser = await getSafeUserById(msg.authorAdminId);
          authorRole = adminUser?.role || null;
          authorIsAdmin = adminUser?.isAdmin || adminUser?.role === "admin" || false;
        } else if (msg.authorUserId) {
          // This is a user message
          const userInfo = await getSafeUserById(msg.authorUserId);
          authorRole = userInfo?.role || null;
          authorIsAdmin = userInfo?.isAdmin || userInfo?.role === "admin" || false;
        }

        return {
          ...msg,
          authorRole,
          authorIsAdmin,
        };
      })
    );

    return NextResponse.json({
      messages: messagesWithRoles,
    });
  } catch (error) {
    console.error("Error fetching feedback messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

