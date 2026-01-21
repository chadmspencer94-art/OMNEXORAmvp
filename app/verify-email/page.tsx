"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Mail, ExternalLink, AlertCircle } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Verification link is invalid or missing.");
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        // Handle already verified
        if (data.alreadyVerified) {
          setStatus("success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
          return;
        }

        if (!response.ok) {
          setStatus("error");
          setError(data.error || "This verification link is invalid or has expired.");
          return;
        }

        setStatus("success");

        // Auto-redirect after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setError("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);
    setDevVerifyUrl(null);
    
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      // Handle already verified
      if (data.alreadyVerified) {
        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
        return;
      }
      
      if (!response.ok) {
        setResendError(data.error || "Failed to resend verification email. Please try again.");
        return;
      }

      // In dev mode, show the verification URL
      if (data.verifyUrl) {
        setDevVerifyUrl(data.verifyUrl);
        setResendSuccess(true);
      } else if (data.emailSent) {
        setResendSuccess(true);
      } else if (data.warning) {
        setResendError(data.warning);
      }
    } catch (err) {
      setResendError("Network error. Please check your connection and try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {status === "loading" && (
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              )}
              {status === "error" && (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {status === "loading" && "Verifying your email..."}
              {status === "success" && "Email verified!"}
              {status === "error" && "Verification failed"}
            </h1>
          </div>

          {status === "loading" && (
            <p className="text-slate-600 text-center">
              Please wait while we verify your email address.
            </p>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <p className="text-slate-600">
                Your email has been verified. You can now use all features of OMNEXORA.
              </p>
              <p className="text-sm text-slate-500">
                Redirecting to your dashboard...
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 text-amber-600 hover:text-amber-700 font-medium"
              >
                Go to dashboard now →
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <p className="text-slate-600 text-center">
                {error}
              </p>
              
              <div className="pt-4 border-t border-slate-200 space-y-3">
                {/* Resend Error */}
                {resendError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700">{resendError}</span>
                  </div>
                )}
                
                {/* Resend Success */}
                {resendSuccess && !devVerifyUrl && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-emerald-700">
                      Verification email sent! Check your inbox (and spam folder).
                    </span>
                  </div>
                )}
                
                {/* Dev mode: show verification link */}
                {devVerifyUrl && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-2">
                      Dev Mode: Click to verify directly
                    </p>
                    <a
                      href={devVerifyUrl}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open verification link
                    </a>
                  </div>
                )}
                
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {resendSuccess ? "Resend again" : "Resend verification email"}
                    </>
                  )}
                </button>
                
                <Link
                  href="/dashboard"
                  className="block w-full text-center px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Go to dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
