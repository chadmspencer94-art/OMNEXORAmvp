import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import { featureFlags } from "@/lib/featureFlags";
import RateTemplatesClient from "./RateTemplatesClient";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RateTemplatesPage() {
  const user = await requireActiveUser("/settings/rates");

  // Check if rate templates feature is enabled
  if (!featureFlags.showRateTemplates) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Rate Templates Not Available</h1>
          <p className="text-slate-600 mb-6">
            This feature isn&apos;t available yet in the current OMNEXORA pilot.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            Back to Settings
          </Link>
        </div>
      </div>
    );
  }

  // Redirect clients
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  return <RateTemplatesClient />;
}

