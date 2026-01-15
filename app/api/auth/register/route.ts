import { NextRequest, NextResponse } from "next/server";
import { createUser, createSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, type UserRole, FOUNDER_EMAILS } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { Resend } from "resend";
import { getSignupMode, isValidInviteCode } from "@/lib/signup-config";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = process.env.EMAIL_FROM || "OMNEXORA <onboarding@resend.dev>";

interface RegisterRequestBody {
  email: string;
  password: string;
  role?: UserRole;
  inviteCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const { email, password, role, inviteCode } = body;

    // Check signup mode
    const signupMode = getSignupMode();
    
    // If signup is closed, reject registration
    if (signupMode === "closed") {
      return NextResponse.json(
        { error: "Registrations are currently closed. Please contact support." },
        { status: 403 }
      );
    }

    // If signup is invite-only, validate invite code or email
    if (signupMode === "invite-only") {
      const normalizedEmail = email.toLowerCase().trim();
      const isFounderEmail = FOUNDER_EMAILS.includes(normalizedEmail);
      
      // Allow founder emails or valid invite codes
      if (!isFounderEmail) {
        if (!inviteCode || typeof inviteCode !== "string" || !isValidInviteCode(inviteCode.trim())) {
          return NextResponse.json(
            { error: "This invite code isn't valid. Check it or contact Chad." },
            { status: 403 }
          );
        }
      }
    }

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
    // CLIENT SIGNUP IS DISABLED - only tradies can self-register
    // Admins can change roles later via the admin users page
    // Block any attempt to register as client
    if (role === "client") {
      return NextResponse.json(
        { error: "Client registration is not available. Only trade businesses can sign up." },
        { status: 403 }
      );
    }
    const validSelfSignupRoles: UserRole[] = ["tradie"];
    const userRole: UserRole = role && validSelfSignupRoles.includes(role) ? role : "tradie";

    // Create the user
    const user = await createUser(email, password, userRole);

    // Create a session
    const sessionId = await createSession(user.id);

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      // Ensure user exists in Prisma (for email verification token)
      const prisma = getPrisma();
      let prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!prismaUser) {
        // Create user in Prisma if it doesn't exist
        prismaUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            passwordHash: "", // KV store has the real password hash
            role: user.role,
            verificationStatus: user.verificationStatus,
            verifiedAt: user.verifiedAt ? new Date(user.verifiedAt) : null,
          },
        });
      }

      // Create verification token
      const rawToken = await createEmailVerificationToken(prismaUser.id);

      // Build base URL
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
        "http://localhost:3000";

      // Build verify URL
      const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

      // Build email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">OMNEXORA</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email</h2>
              <p>Welcome to OMNEXORA! Please verify your email address to unlock all features.</p>
              <p>Click the button below to verify your email. This link will expire in 24 hours.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: #f59e0b; color: #1e293b; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
              </div>
              <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #64748b; word-break: break-all;">${verifyUrl}</p>
              <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `;

      const emailText = `
Verify Your Email

Welcome to OMNEXORA! Please verify your email address to unlock all features.

Click the link below to verify your email. This link will expire in 24 hours.

${verifyUrl}

If you didn't create an account, you can safely ignore this email.
      `.trim();

      // Send email via Resend
      if (resend) {
        try {
          const { error } = await resend.emails.send({
            from: DEFAULT_FROM,
            to: user.email,
            subject: "Verify your OMNEXORA email",
            html: emailHtml,
            text: emailText,
          });

          if (error) {
            console.error("Failed to send verification email:", error);
          } else {
            console.log(`Verification email sent to ${user.email}`);
          }
        } catch (err) {
          console.error("Error sending verification email:", err);
        }
      } else {
        console.warn("RESEND_API_KEY not set, verification email not sent");
        console.log(`Would have sent verification email to ${user.email}`);
        console.log(`Verify URL: ${verifyUrl}`);
      }
    } catch (emailError) {
      // Log but don't fail registration
      console.error("Error sending verification email during registration:", emailError);
    }

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
