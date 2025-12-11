"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface OnboardingChecklistProps {
  hasBusinessProfile: boolean;
  hasAnyClients: boolean;
  hasAnyJobs: boolean;
}

export default function OnboardingChecklist({
  hasBusinessProfile,
  hasAnyClients,
  hasAnyJobs,
}: OnboardingChecklistProps) {
  // If all steps are complete, don't show the checklist
  if (hasBusinessProfile && hasAnyClients && hasAnyJobs) {
    return null;
  }

  const steps = [
    {
      id: "business-profile",
      label: "Set up your business profile",
      completed: hasBusinessProfile,
      href: "/settings/business-profile",
    },
    {
      id: "clients",
      label: "Add your first client",
      completed: hasAnyClients,
      href: "/clients",
    },
    {
      id: "jobs",
      label: "Create your first job and generate a Job Pack",
      completed: hasAnyJobs,
      href: "/jobs/new",
    },
  ];

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Getting your OMNEXORA workspace ready
      </h2>
      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
            )}
            {step.completed ? (
              <span className="text-slate-700 line-through">{step.label}</span>
            ) : (
              <Link
                href={step.href}
                className="text-amber-700 hover:text-amber-800 font-medium underline"
              >
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

