"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/app/components/Footer";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("[login] attempting login for email", email);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[login] failed to parse response", parseError);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorMessage = data?.error || "Login failed";
        console.error("[login] login failed", { status: response.status, error: errorMessage });
        // Show user-friendly error messages
        if (response.status === 401 || response.status === 400) {
          setError("Incorrect email or password");
        } else {
          setError(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      console.log("[login] login successful, redirecting");
      // After successful login, redirect to dashboard
      // Server-side guards on protected pages will handle:
      // - Redirecting clients to /client/dashboard
      // - Redirecting non-onboarded users to /onboarding
      // This avoids client-side checks that can cause flicker
      
      // Validate redirect to prevent open redirect attacks
      const redirectParam = searchParams.get("redirect");
      let redirectTo = "/dashboard";
      
      if (redirectParam) {
        // Only allow relative paths starting with / (not // or external URLs)
        const isValidRedirect = 
          redirectParam.startsWith("/") && 
          !redirectParam.startsWith("//") &&
          !redirectParam.includes(":");
        
        if (isValidRedirect) {
          redirectTo = redirectParam;
        }
      }
      
      // Use replace to avoid adding to history, then refresh to update navbar
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      console.error("[login] unexpected error during login", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-sm text-slate-600">Sign in to your OMNEXORA account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {searchParams.get("reset") === "success" && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            Password reset successful! You can now sign in with your new password.
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-amber-600 hover:text-amber-500 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors shadow-lg shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent static caching of auth state
// This ensures the page always checks current auth status
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-slate-900 overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/auth-hero-bg.png"
          alt="OMNEXORA - Sign in to your account"
          className="w-full h-full object-cover"
          style={{ 
            objectFit: 'cover',
            objectPosition: 'center',
            minWidth: '100%',
            minHeight: '100%'
          }}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="text-center">
                <p className="text-slate-600">Loading...</p>
              </div>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <Footer />
    </div>
  );
}
