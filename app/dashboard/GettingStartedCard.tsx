"use client";

import { Check, Circle } from "lucide-react";
import Button from "@/app/components/ui/Button";

interface GettingStartedCardProps {
  user: {
    id: string;
    role: string;
    businessName?: string | null;
    tradingName?: string | null;
    primaryTrade?: string | null;
    abn?: string | null;
    hourlyRate?: number | null;
    serviceRadiusKm?: number | null;
    servicePostcodes?: string | null;
  };
  hasJobs: boolean;
}

export default function GettingStartedCard({ user, hasJobs }: GettingStartedCardProps) {
  // Don't show for clients
  if (user.role === "client") {
    return null;
  }

  // Check completion status for each item
  const businessProfileComplete =
    (!!user.businessName || !!user.tradingName) &&
    !!user.primaryTrade &&
    !!user.abn;

  const pricingAndServiceComplete =
    !!user.hourlyRate &&
    (!!user.serviceRadiusKm || (!!user.servicePostcodes && user.servicePostcodes.trim() !== ""));

  const firstJobComplete = hasJobs;

  // If all items are complete, don't show the card
  if (businessProfileComplete && pricingAndServiceComplete && firstJobComplete) {
    return null;
  }

  return (
    <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Getting Started</h2>
        <p className="text-sm text-slate-600 mt-1">
          Let&apos;s get OMNEXORA dialled in for your business. Complete these quick steps to get the best AI job packs.
        </p>
      </div>
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Business Profile */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-0 rounded-lg sm:rounded-none hover:bg-slate-50 sm:hover:bg-transparent transition-colors">
          <div className="flex-shrink-0 flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {businessProfileComplete ? (
                <Check className="w-5 h-5 text-green-600" aria-label="Completed" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" aria-label="Not completed" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900">Complete your business profile</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Add your business name, trade type, and ABN so clients can find you.
              </p>
            </div>
          </div>
          {!businessProfileComplete && (
            <div className="flex-shrink-0 sm:ml-auto sm:mt-0.5">
              <Button
                asLink
                href="/settings/business-profile"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
              >
                Open
              </Button>
            </div>
          )}
        </div>

        {/* Pricing and Service Area */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-0 rounded-lg sm:rounded-none hover:bg-slate-50 sm:hover:bg-transparent transition-colors">
          <div className="flex-shrink-0 flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {pricingAndServiceComplete ? (
                <Check className="w-5 h-5 text-green-600" aria-label="Completed" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" aria-label="Not completed" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900">Set your pricing and service area</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Configure your hourly rate and where you&apos;re available to work.
              </p>
            </div>
          </div>
          {!pricingAndServiceComplete && (
            <div className="flex-shrink-0 sm:ml-auto sm:mt-0.5">
              <Button
                asLink
                href="/settings/business-profile"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
              >
                Open
              </Button>
            </div>
          )}
        </div>

        {/* First Job */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-0 rounded-lg sm:rounded-none hover:bg-slate-50 sm:hover:bg-transparent transition-colors">
          <div className="flex-shrink-0 flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {firstJobComplete ? (
                <Check className="w-5 h-5 text-green-600" aria-label="Completed" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" aria-label="Not completed" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900">Create your first job</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Generate your first AI job pack to see how OMNEXORA works.
              </p>
            </div>
          </div>
          {!firstJobComplete && (
            <div className="flex-shrink-0 sm:ml-auto sm:mt-0.5">
              <Button
                asLink
                href="/jobs/new"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
              >
                Open
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

