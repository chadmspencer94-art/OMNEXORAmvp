"use client";

import { CheckCircle, Circle } from "lucide-react";
import Button from "@/app/components/ui/Button";

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
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Get OMNEXORA set up
      </h2>
      <ul className="space-y-3 sm:space-y-4">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3 p-3 sm:p-0 rounded-lg sm:rounded-none hover:bg-amber-100/50 sm:hover:bg-transparent transition-colors"
          >
            <div className="flex-shrink-0 flex items-start gap-3">
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-label="Completed" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" aria-label="Not completed" />
              )}
              <div className="flex-1 min-w-0">
                {step.completed ? (
                  <span className="text-slate-700 line-through font-medium block">{step.label}</span>
                ) : (
                  <span className="text-slate-900 font-medium block">{step.label}</span>
                )}
                <p className="text-sm text-slate-600 mt-0.5">{step.description}</p>
              </div>
            </div>
            {!step.completed && (
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
          </li>
        ))}
      </ul>
    </div>
  );
}

