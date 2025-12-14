import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { Resend } from "resend";
import { createPasswordResetToken } from "@/lib/password-reset";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = process.env.EMAIL_FROM || "OMNEXORA <onboarding@resend.dev>";

/**
 * POST /api/auth/forgot-password
 * Generates a password reset token and sends reset email
 * Security: Always returns success to prevent email enumeration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success (security: don't reveal if email exists)
    // But only create token and send email if user exists
    if (user) {
      // Create password reset token using helper
      const rawToken = await createPasswordResetToken(user.id);

      // Build reset URL
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
        "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      // Build email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">OMNEXORA</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
              <p>You requested to reset your password for your OMNEXORA account.</p>
              <p>Click the button below to reset your password. This link will expire in 60 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #f59e0b; color: #1e293b; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #64748b; word-break: break-all;">${resetUrl}</p>
              <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `;

      const emailText = `
Reset Your Password

You requested to reset your password for your OMNEXORA account.

Click the link below to reset your password. This link will expire in 60 minutes.

${resetUrl}

If you didn't request this, you can safely ignore this email.
      `.trim();

      // Send email via Resend
      if (resend) {
        try {
          const { error } = await resend.emails.send({
            from: DEFAULT_FROM,
            to: normalizedEmail,
            subject: "Reset Your OMNEXORA Password",
            html: emailHtml,
            text: emailText,
          });

          if (error) {
            console.error("Failed to send password reset email:", error);
            // Still return success to user (security)
          } else {
            console.log(`Password reset email sent to ${normalizedEmail}`);
          }
        } catch (err) {
          console.error("Error sending password reset email:", err);
          // Still return success to user (security)
        }
      } else {
        console.warn("RESEND_API_KEY not set, password reset email not sent");
        console.log(`Would have sent password reset email to ${normalizedEmail}`);
        console.log(`Reset URL: ${resetUrl}`);
      }
    } else {
      // User doesn't exist, but still return success (security)
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
    }

    // Always return success (security: don't reveal if email exists)
    return NextResponse.json(
      { success: true, message: "If an account with that email exists, we've sent a password reset link." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot-password endpoint:", error);
    // Still return success to prevent email enumeration
    return NextResponse.json(
      { success: true, message: "If an account with that email exists, we've sent a password reset link." },
      { status: 200 }
    );
  }
}

