"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Success - redirect to original page or dashboard
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
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-slate-600">Sign in to your OMNEXORA account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-500">
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

function LoginPageClient() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Guard: Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // User is already logged in, redirect to dashboard
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        // If check fails, user is not logged in - show login form
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center">
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
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
  );
}

export default LoginPageClient;
