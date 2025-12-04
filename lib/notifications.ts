import type { SafeUser, TradieBusinessDetails } from "./auth";

// ============================================================================
// Types
// ============================================================================

export type NotificationEvent =
  | "tradie_verification_submitted"
  | "tradie_verification_approved"
  | "tradie_verification_rejected";

export interface NotificationPayload {
  user: SafeUser;
  businessDetails?: TradieBusinessDetails;
  rejectionReason?: string;
}

// ============================================================================
// Email Templates
// ============================================================================

interface EmailTemplate {
  subject: string;
  body: string;
}

function getVerificationSubmittedTemplate(payload: NotificationPayload): EmailTemplate {
  return {
    subject: "We've received your business verification documents",
    body: `Hi,

Thank you for submitting your business verification documents to OMNEXORA.

We've received your application and our team is now reviewing your details. This usually takes 1-2 business days.

You submitted:
- Business Name: ${payload.businessDetails?.businessName || "Not provided"}
- ABN: ${payload.businessDetails?.abn || "Not provided"}
- Service Area: ${payload.businessDetails?.serviceArea || "Not provided"}

We'll email you as soon as your verification is complete.

If you have any questions, please reply to this email.

Regards,
The OMNEXORA Team`,
  };
}

function getVerificationApprovedTemplate(payload: NotificationPayload): EmailTemplate {
  return {
    subject: "🎉 Your OMNEXORA trade account is now verified!",
    body: `Hi,

Great news! Your OMNEXORA trade account has been verified.

You now have access to:
✓ Display your "Verified Trade" badge to clients
✓ Email AI-generated job packs directly to clients
✓ Full access to all platform features

Your verified business:
- Business Name: ${payload.businessDetails?.businessName || "Not provided"}
- ABN: ${payload.businessDetails?.abn || "Not provided"}

Start creating job packs and winning more work today!

Regards,
The OMNEXORA Team`,
  };
}

function getVerificationRejectedTemplate(payload: NotificationPayload): EmailTemplate {
  return {
    subject: "Update on your OMNEXORA business verification",
    body: `Hi,

We've reviewed your business verification documents and unfortunately we weren't able to verify your account at this time.

Reason: ${payload.rejectionReason || "Additional documentation required."}

What to do next:
1. Review the reason above
2. Update your documents or information
3. Re-submit your verification at any time

If you believe this was an error or have questions, please reply to this email.

Regards,
The OMNEXORA Team`,
  };
}

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Sends a notification email for the given event
 * Note: This is a stub implementation that logs to console
 * In production, integrate with your email provider (SendGrid, Resend, etc.)
 */
export async function sendNotification(
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  let template: EmailTemplate;

  switch (event) {
    case "tradie_verification_submitted":
      template = getVerificationSubmittedTemplate(payload);
      break;
    case "tradie_verification_approved":
      template = getVerificationApprovedTemplate(payload);
      break;
    case "tradie_verification_rejected":
      template = getVerificationRejectedTemplate(payload);
      break;
    default:
      console.error(`Unknown notification event: ${event}`);
      return;
  }

  // Log the email (in production, send via email provider)
  console.log("=== SENDING NOTIFICATION EMAIL ===");
  console.log(`To: ${payload.user.email}`);
  console.log(`Subject: ${template.subject}`);
  console.log(`Body:\n${template.body}`);
  console.log("=================================");

  // TODO: Integrate with email provider
  // Example with Resend:
  // await resend.emails.send({
  //   from: "OMNEXORA <noreply@omnexora.com>",
  //   to: payload.user.email,
  //   subject: template.subject,
  //   text: template.body,
  // });
}

