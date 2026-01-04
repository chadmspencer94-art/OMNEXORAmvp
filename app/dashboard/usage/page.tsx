import Link from "next/link";
import { requireOnboardedUser } from "@/lib/authChecks";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import StructuredBadge from "@/app/components/StructuredBadge";
import { ArrowLeft } from "lucide-react";

export default async function UsagePage() {
  const user = await requireOnboardedUser();

  const verificationStatus = user.verificationStatus || "unverified";
  const isVerified = verificationStatus === "verified";

  // Get plan tier from Prisma
  let planTier = "FREE";
  let planStatus = "TRIAL";
  try {
    const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { planTier: true, planStatus: true },
    });
    if (prismaUser?.planTier) {
      planTier = prismaUser.planTier;
    }
    if (prismaUser?.planStatus) {
      planStatus = prismaUser.planStatus;
    }
  } catch (error) {
    console.error("Failed to load plan info:", error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              Usage
              {isVerified && <StructuredBadge />}
            </h1>
            <p className="mt-2 text-slate-600">
              Credits, activity, and subscription details
            </p>
          </div>
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{planTier}</p>
            <p className="text-sm text-slate-500 mt-1">Status: {planStatus}</p>
          </div>
          <Link
            href="/billing"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
          >
            Manage Plan
          </Link>
        </div>
      </div>

      {/* Credits */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Credits</h2>
        <div className="flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm text-slate-500">Credits Remaining</p>
            <p className="text-3xl font-bold text-slate-900">∞</p>
            <p className="text-xs text-slate-400 mt-1">Unlimited during beta</p>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Summary</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">Job Packs Created</p>
                <p className="text-xs text-slate-500">All time</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-900">-</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">Quotes Sent</p>
                <p className="text-xs text-slate-500">All time</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-900">-</p>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">Last Activity</p>
                <p className="text-xs text-slate-500">Recent usage</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-900">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}

