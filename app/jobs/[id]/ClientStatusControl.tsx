"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ClientStatus = "draft" | "sent" | "accepted" | "declined" | "cancelled";

interface ClientStatusControlProps {
  jobId: string;
  currentStatus: ClientStatus;
}

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent to client" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ClientStatusControl({
  jobId,
  currentStatus,
}: ClientStatusControlProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/client-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientStatus: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update status");
        setIsUpdating(false);
        return;
      }

      setIsUpdating(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-500">
        Update client status
      </label>
      <div className="relative">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
          disabled={isUpdating}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

