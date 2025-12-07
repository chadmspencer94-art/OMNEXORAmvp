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
    const user = await verifyUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a session
    const sessionId = await createSession(user.id);

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
