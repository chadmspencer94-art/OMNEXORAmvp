"use client";

import { useState } from "react";
import { X, Mail, Loader2, AlertCircle, ExternalLink, CheckCircle } from "lucide-react";

interface EmailVerificationBannerProps {
  userEmail: string;
}

export default function EmailVerificationBanner({ userEmail }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError(null);
    setWarning(null);
    setDevVerifyUrl(null);
    
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      // Check for already verified (returns 200 with alreadyVerified flag)
      if (data.alreadyVerified) {
        // User verified in another tab/window, refresh page
        window.location.reload();
        return;
      }
      
      if (!response.ok) {
        // Handle error response
        setError(data.error || "Failed to resend verification email. Please try again.");
        return;
      }

      // Check for warnings (email couldn't be sent but request succeeded - dev mode)
      if (data.warning) {
        setWarning(data.warning);
      }
      
      // In dev mode, show the verification URL
      if (data.verifyUrl) {
        setDevVerifyUrl(data.verifyUrl);
        setResendSuccess(true);
      } else if (data.emailSent) {
        setResendSuccess(true);
        // Auto-clear success message after 10 seconds
        setTimeout(() => {
          setResendSuccess(false);
        }, 10000);
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
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
          
          <div className="flex flex-col gap-2">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-700">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {/* Success message */}
            {resendSuccess && !devVerifyUrl && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-700">
                  Verification email sent! Check your inbox (and spam folder).
                </span>
              </div>
            )}
            
            {/* Warning message when email couldn't be sent */}
            {warning && (
              <div className="flex items-start gap-2 p-2 bg-amber-100/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-800">{warning}</span>
              </div>
            )}
            
            {/* Dev mode: show verification link */}
            {devVerifyUrl && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  Dev Mode: Click to verify directly
                </p>
                <a
                  href={devVerifyUrl}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open verification link
                </a>
              </div>
            )}
            
            {/* Resend button */}
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
                    {resendSuccess ? "Resend again" : "Resend verification email"}
                  </>
                )}
              </button>
            </div>
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
