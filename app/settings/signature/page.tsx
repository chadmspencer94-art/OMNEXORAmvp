import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { featureFlags } from "@/lib/featureFlags";
import SignaturePageClient from "./SignaturePageClient";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignaturePage() {
  await requireActiveUser("/settings/signature");
  
  // Check if signature feature is enabled
  if (!featureFlags.showSignature) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Signature Not Available</h1>
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
  
  return <SignaturePageClient />;
}
