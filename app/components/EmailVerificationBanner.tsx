"use client";

import { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";

interface EmailVerificationBannerProps {
  userEmail: string;
}

export default function EmailVerificationBanner({ userEmail }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.alreadyVerified) {
          // User verified in another tab/window, refresh page
          window.location.reload();
          return;
        }
        throw new Error(data.error || "Failed to resend verification email");
      }

      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err: any) {
      alert(err.message || "Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-900 mb-1">
            Your email is not verified
          </p>
          <p className="text-sm text-amber-800 mb-3">
            Some features may be limited. Please verify your email address ({userEmail}) to unlock all features.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend verification email
                </>
              )}
            </button>
            {resendSuccess && (
              <span className="text-sm text-amber-700">
                ✓ Verification email sent! Check your inbox.
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
