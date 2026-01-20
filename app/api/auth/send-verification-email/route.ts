import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { Resend } from "resend";
import { createEmailVerificationToken } from "@/lib/email-verification";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = process.env.EMAIL_FROM || "OMNEXORA <onboarding@resend.dev>";

/**
 * POST /api/auth/send-verification-email
 * Sends an email verification link to the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is already verified
    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, emailVerifiedAt: true },
    });

    if (prismaUser?.emailVerifiedAt) {
      return NextResponse.json(
        { success: true, alreadyVerified: true },
        { status: 200 }
      );
    }

    // Rate limiting: Check if a token was created recently (within last 5 minutes)
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: prismaUser!.id,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      },
    });

    if (recentToken) {
      return NextResponse.json(
        { error: "Please wait a few minutes before requesting another verification email." },
        { status: 429 }
      );
    }

    // Create email verification token
    const rawToken = await createEmailVerificationToken(prismaUser!.id);

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
    let emailSent = false;
    let emailError: string | null = null;
    
    if (resend) {
      try {
        const { error } = await resend.emails.send({
          from: DEFAULT_FROM,
          to: currentUser.email,
          subject: "Verify your OMNEXORA email",
          html: emailHtml,
          text: emailText,
        });

        if (error) {
          console.error("Failed to send verification email:", error);
          emailError = error.message || "Failed to send email";
        } else {
          console.log(`Verification email sent to ${currentUser.email}`);
          emailSent = true;
        }
      } catch (err: any) {
        console.error("Error sending verification email:", err);
        emailError = err?.message || "Failed to send email";
      }
    } else {
      console.warn("RESEND_API_KEY not set, verification email not sent");
      emailError = "Email service not configured";
    }
    
    // In development, always log the verification URL for easy testing
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log("\n==== DEV MODE: VERIFICATION URL ====");
      console.log(`Email: ${currentUser.email}`);
      console.log(`Verify URL: ${verifyUrl}`);
      console.log("=====================================\n");
    }

    return NextResponse.json(
      { 
        success: true,
        emailSent,
        // Include verification URL in dev mode for testing
        ...(isDev && { verifyUrl }),
        // Include error message if email failed (for user feedback)
        ...(emailError && !emailSent && { warning: "Email could not be sent. Please try again or contact support." }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in send-verification-email endpoint:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}

