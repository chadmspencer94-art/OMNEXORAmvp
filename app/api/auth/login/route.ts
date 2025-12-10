import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSession, updateLastLogin, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const { email, password } = body;

    console.log("[login] attempting login for email", email);

    // Validate input
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Verify the user
    let user;
    try {
      user = await verifyUser(email, password);
    } catch (verifyError) {
      console.error("[login] Error verifying user:", verifyError);
      return NextResponse.json(
        { error: "An error occurred during login. Please try again." },
        { status: 500 }
      );
    }

    if (!user) {
      console.error("[login] Invalid credentials for email", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("[login] user verified, creating session for user", user.id);

    // Create a session
    let sessionId;
    try {
      sessionId = await createSession(user.id);
    } catch (sessionError) {
      console.error("[login] Error creating session:", sessionError);
      return NextResponse.json(
        { error: "An error occurred during login. Please try again." },
        { status: 500 }
      );
    }

    console.log("[login] session created successfully", sessionId);

    // Update last login timestamp (don't await - fire and forget for performance)
    updateLastLogin(user.id).catch((err) => {
      console.error("[login] Failed to update last login:", err);
    });

    // Create response and set the session cookie directly on it
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

    console.log("[login] login successful for user", user.id);
    return response;
  } catch (error) {
    console.error("[login] Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
