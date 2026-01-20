"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Verification link is invalid.");
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
    setDevVerifyUrl(null);
    
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to resend verification email. Please try again.");
        return;
      }

      // In dev mode, show the verification URL
      if (data.verifyUrl) {
        setDevVerifyUrl(data.verifyUrl);
        setResendSuccess(true);
      } else if (data.emailSent) {
        setResendSuccess(true);
        alert("Verification email sent. Check your inbox (and spam folder).");
      } else if (data.warning) {
        setError(data.warning);
      }
    } catch (err) {
      setError("Failed to resend verification email. Please try again.");
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
                <svg className="w-8 h-8 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {status === "success" && (
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status === "error" && (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                Email verified. You can now use all features of OMNEXORA.
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
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Sending..." : "Resend verification email"}
                </button>
                
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
                      Open verification link →
                    </a>
                  </div>
                )}
                
                {resendSuccess && !devVerifyUrl && (
                  <p className="text-sm text-emerald-600 text-center">
                    ✓ Verification email sent! Check your inbox.
                  </p>
                )}
                
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

