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
        { error: "Not authenticated. Please log in first." },
        { status: 401 }
      );
    }

    const prisma = getPrisma();
    
    // Check if user exists in Prisma, create if not
    let prismaUser = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, emailVerifiedAt: true },
    });

    // If user doesn't exist in Prisma, create them
    if (!prismaUser) {
      try {
        prismaUser = await prisma.user.create({
          data: {
            id: currentUser.id,
            email: currentUser.email,
            passwordHash: "", // KV store has the real password hash
            role: currentUser.role || "tradie",
            verificationStatus: currentUser.verificationStatus || "unverified",
            planTier: currentUser.planTier || "FREE",
            planStatus: currentUser.planStatus || "TRIAL",
          },
          select: { id: true, emailVerifiedAt: true },
        });
        console.log(`[send-verification] Created Prisma user for ${currentUser.email}`);
      } catch (createError: any) {
        // If unique constraint violation, try to find the user again
        if (createError.code === "P2002") {
          prismaUser = await prisma.user.findUnique({
            where: { email: currentUser.email },
            select: { id: true, emailVerifiedAt: true },
          });
        }
        
        if (!prismaUser) {
          console.error("[send-verification] Failed to create/find Prisma user:", createError);
          return NextResponse.json(
            { error: "Failed to initialize user. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    // Check if user is already verified
    if (prismaUser.emailVerifiedAt) {
      return NextResponse.json(
        { success: true, alreadyVerified: true },
        { status: 200 }
      );
    }

    // Rate limiting: Check if a token was created recently (within last 2 minutes)
    // Reduced from 5 minutes to be more user-friendly while still preventing abuse
    try {
      const recentToken = await prisma.emailVerificationToken.findFirst({
        where: {
          userId: prismaUser.id,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          },
        },
      });

      if (recentToken) {
        return NextResponse.json(
          { error: "Please wait 2 minutes before requesting another verification email." },
          { status: 429 }
        );
      }
    } catch (tokenCheckError) {
      // If token check fails, continue anyway - better UX than blocking
      console.warn("[send-verification] Rate limit check failed:", tokenCheckError);
    }

    // Create email verification token
    let rawToken: string;
    try {
      rawToken = await createEmailVerificationToken(prismaUser.id);
    } catch (tokenError) {
      console.error("[send-verification] Failed to create verification token:", tokenError);
      return NextResponse.json(
        { error: "Failed to create verification link. Please try again." },
        { status: 500 }
      );
    }

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
        console.log(`[send-verification] Attempting to send email to ${currentUser.email} from ${DEFAULT_FROM}`);
        const { error, data } = await resend.emails.send({
          from: DEFAULT_FROM,
          to: currentUser.email,
          subject: "Verify your OMNEXORA email",
          html: emailHtml,
          text: emailText,
        });

        if (error) {
          console.error("[send-verification] Resend API error:", JSON.stringify(error));
          // Provide more specific error messages based on common Resend errors
          if (error.message?.includes("domain") || error.message?.includes("not verified")) {
            emailError = "Email domain not verified. Please contact support or use a different email.";
          } else if (error.message?.includes("rate") || error.message?.includes("limit")) {
            emailError = "Too many emails sent. Please try again in a few minutes.";
          } else if (error.message?.includes("invalid") || error.message?.includes("recipient")) {
            emailError = "Invalid email address. Please check your email and try again.";
          } else {
            emailError = error.message || "Failed to send email. Please try again.";
          }
        } else {
          console.log(`[send-verification] Email sent successfully to ${currentUser.email}, ID: ${data?.id}`);
          emailSent = true;
        }
      } catch (err: any) {
        console.error("[send-verification] Exception sending email:", err);
        emailError = err?.message || "Failed to send email. Please try again.";
      }
    } else {
      console.warn("[send-verification] RESEND_API_KEY not configured - emails cannot be sent");
      emailError = "Email service not configured. Please contact support.";
    }
    
    // In development, always log the verification URL for easy testing
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log("\n==== DEV MODE: VERIFICATION URL ====");
      console.log(`Email: ${currentUser.email}`);
      console.log(`Verify URL: ${verifyUrl}`);
      console.log("=====================================\n");
    }

    // If email wasn't sent and we're in production, return an error
    if (!emailSent && !isDev) {
      return NextResponse.json(
        { 
          error: emailError || "Failed to send verification email. Please try again.",
          emailSent: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        emailSent,
        // Include verification URL in dev mode for testing
        ...(isDev && { verifyUrl }),
        // Include warning if email failed but we're allowing dev mode
        ...(emailError && !emailSent && { warning: emailError }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[send-verification] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
