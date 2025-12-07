import { NextRequest, NextResponse } from "next/server";
import { createUser, createSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, type UserRole } from "@/lib/auth";

interface RegisterRequestBody {
  email: string;
  password: string;
  role?: UserRole;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const { email, password, role } = body;

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate role (if provided)
    // For self-signup, only allow tradie or client roles for security
    // Admins can change roles later via the admin users page
    const validSelfSignupRoles: UserRole[] = ["tradie", "client"];
    const userRole: UserRole = role && validSelfSignupRoles.includes(role) ? role : "tradie";

    // Create the user
    const user = await createUser(email, password, userRole);

    // Create a session
    const sessionId = await createSession(user.id);

    // Create response and set the session cookie directly on it
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt,
        isAdmin: user.isAdmin,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
