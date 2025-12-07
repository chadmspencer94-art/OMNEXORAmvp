"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<{ email: string; businessName?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkImpersonationStatus();
  }, []);

  const checkImpersonationStatus = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        // Check if we have impersonation flag in session
        // For now, we'll detect it by checking if current user != real admin
        // We'll enhance this with a dedicated endpoint later
        setIsImpersonating(false); // Placeholder - will be enhanced
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopImpersonating = async () => {
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      if (response.ok) {
        router.refresh();
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    }
  };

  if (isLoading || !isImpersonating) {
    return null;
  }

  return (
    <div className="bg-amber-500 border-b border-amber-600 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm font-medium text-amber-900">
            You are currently acting as:{" "}
            <span className="font-semibold">
              {impersonatedUser?.email}
              {impersonatedUser?.businessName && ` (${impersonatedUser.businessName})`}
            </span>
          </p>
        </div>
        <button
          onClick={handleStopImpersonating}
          className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Stop Impersonating
        </button>
      </div>
    </div>
  );
}

