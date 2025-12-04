import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    // Try to delete the session from KV, but don't let it block cookie deletion
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch (error) {
        // Log KV error but continue - we still want to clear the cookie
        console.error("Failed to delete session from KV:", error);
      }
    }

    // Always create response and clear the session cookie
    // This ensures the user is logged out client-side even if KV cleanup failed
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    // This catch is for unexpected errors (e.g., cookies() failing)
    console.error("Logout error:", error);
    
    // Still try to clear the cookie even on error
    const response = NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    return response;
  }
}
