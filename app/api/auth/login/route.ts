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
      console.error("Error verifying user:", verifyError);
      return NextResponse.json(
        { error: "An error occurred during login. Please try again." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a session
    let sessionId;
    try {
      sessionId = await createSession(user.id);
    } catch (sessionError) {
      console.error("Error creating session:", sessionError);
      return NextResponse.json(
        { error: "An error occurred during login. Please try again." },
        { status: 500 }
      );
    }

    // Update last login timestamp (don't await - fire and forget for performance)
    updateLastLogin(user.id).catch((err) => {
      console.error("Failed to update last login:", err);
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

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
