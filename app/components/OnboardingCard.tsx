"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, X } from "lucide-react";
import type { OnboardingStep } from "@/lib/onboarding-status";
import Button from "@/app/components/ui/Button";

interface OnboardingCardProps {
  steps: OnboardingStep[];
  allDone: boolean;
  onDismiss: () => void;
}

export default function OnboardingCard({ steps, allDone, onDismiss }: OnboardingCardProps) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const response = await fetch("/api/me/onboarding/dismiss", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss onboarding");
      }

      // Refresh the page to hide the card
      router.refresh();
      onDismiss();
    } catch (err) {
      console.error("Error dismissing onboarding:", err);
      alert("Failed to dismiss onboarding. Please try again.");
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Getting started with OMNEXORA</h2>
            <p className="text-sm text-slate-600 mt-1">
              Complete these steps to get the most out of the platform.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {steps.map((step) => (
          <div
            key={step.key}
            className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-0 rounded-lg sm:rounded-none hover:bg-slate-50 sm:hover:bg-transparent transition-colors"
          >
            <div className="flex-shrink-0 flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {step.done ? (
                  <Check className="w-5 h-5 text-green-600" aria-label="Completed" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" aria-label="Not completed" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${step.done ? "text-slate-600" : "text-slate-900"}`}>
                  {step.label}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">{step.description}</p>
              </div>
            </div>
            {!step.done && (
              <div className="flex-shrink-0 sm:ml-auto sm:mt-0.5">
                <Button
                  asLink
                  href={step.href}
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Open
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Great work! You&apos;ve completed all onboarding steps.
            </p>
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDismissing ? "Hiding..." : "Mark complete / Hide"}
            </button>
          </div>
        </div>
      )}

      {!allDone && (
        <div className="px-6 py-4 border-t border-slate-200">
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            {isDismissing ? "Hiding..." : "Hide for now"}
          </button>
        </div>
      )}
    </div>
  );
}

