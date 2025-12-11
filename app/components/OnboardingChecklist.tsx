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

  const steps = [
    {
      id: "business-profile",
      label: "Set up your business profile",
      description: "Add your trading name, ABN and basic details.",
      completed: hasBusinessProfile,
      href: "/settings/business-profile",
    },
    {
      id: "clients",
      label: "Add your first client",
      description: "Save a client so you can attach jobs and job packs.",
      completed: hasAnyClients,
      href: "/clients",
    },
    {
      id: "jobs",
      label: "Create your first job",
      description: "Generate a job pack and quote to test the workflow.",
      completed: hasAnyJobs,
      href: "/jobs/new",
    },
  ];

  // If all steps are complete, show completion message
  if (hasBusinessProfile && hasAnyClients && hasAnyJobs) {
    return (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800 font-medium">
          Setup complete – you&apos;re ready to use OMNEXORA on real jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Get OMNEXORA set up
      </h2>
      <ul className="space-y-4">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            {step.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {step.completed ? (
                <span className="text-slate-700 line-through font-medium">{step.label}</span>
              ) : (
                <Link
                  href={step.href}
                  className="text-amber-700 hover:text-amber-800 font-medium underline block mb-1"
                >
                  {step.label}
                </Link>
              )}
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

