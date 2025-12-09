"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";

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
      <div className="p-6 space-y-4">
        {/* Business Profile */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            {businessProfileComplete ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900">Complete your business profile</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Add your business name, trade type, and ABN so clients can find you.
            </p>
          </div>
          {!businessProfileComplete && (
            <div className="flex-shrink-0">
              <Link
                href="/settings/business-profile"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                Go to Business Profile
              </Link>
            </div>
          )}
        </div>

        {/* Pricing and Service Area */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            {pricingAndServiceComplete ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900">Set your pricing and service area</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Configure your hourly rate and where you&apos;re available to work.
            </p>
          </div>
          {!pricingAndServiceComplete && (
            <div className="flex-shrink-0">
              <Link
                href="/settings/business-profile"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                Review settings
              </Link>
            </div>
          )}
        </div>

        {/* First Job */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            {firstJobComplete ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900">Create your first job</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Generate your first AI job pack to see how OMNEXORA works.
            </p>
          </div>
          {!firstJobComplete && (
            <div className="flex-shrink-0">
              <Link
                href="/jobs/new"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                Create New Job
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

