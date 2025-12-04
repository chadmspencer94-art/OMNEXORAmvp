"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevVerifyButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleForceVerify = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/dev/force-verify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Account verified! Refreshing...");
        setIsLoading(false); // Reset loading state before refresh
        // Refresh to show updated status
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage(`Error: ${data.error || "Failed to verify"}`);
        setIsLoading(false);
      }
    } catch {
      setMessage("Error: Network request failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 border-dashed rounded-lg">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 text-lg">🛠️</span>
          <div>
            <p className="text-sm font-medium text-yellow-800">Dev Mode</p>
            <p className="text-xs text-yellow-600">Force verify your account for testing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
          <button
            onClick={handleForceVerify}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Force verify my account"}
          </button>
        </div>
      </div>
    </div>
  );
}

