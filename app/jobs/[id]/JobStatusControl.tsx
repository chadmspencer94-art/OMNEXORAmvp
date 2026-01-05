"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobWorkflowStatus } from "@/lib/jobs";

interface JobStatusControlProps {
  jobId: string;
  currentStatus: JobWorkflowStatus;
}

const STATUS_OPTIONS: { value: JobWorkflowStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "pending_confirmation", label: "Awaiting Confirmation" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function JobStatusControl({ jobId, currentStatus }: JobStatusControlProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const handleStatusChange = async (newStatus: JobWorkflowStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobStatus: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update status");
        setIsUpdating(false);
        return;
      }

      // Reset loading state before refresh so button doesn't appear stuck
      setIsUpdating(false);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Failed to update status");
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
      >
        {isUpdating ? "Updating..." : "Change status"}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  option.value === currentStatus ? "bg-slate-50 font-medium" : ""
                }`}
              >
                {option.label}
                {option.value === currentStatus && (
                  <span className="ml-2 text-amber-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

