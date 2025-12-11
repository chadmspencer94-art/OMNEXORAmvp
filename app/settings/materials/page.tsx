import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import { featureFlags } from "@/lib/featureFlags";
import MaterialsLibraryClient from "./MaterialsLibraryClient";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MaterialsLibraryPage() {
  const user = await requireActiveUser("/settings/materials");

  // Check if materials feature is enabled
  if (!featureFlags.showMaterials) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Materials Library Not Available</h1>
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

  return <MaterialsLibraryClient />;
}

