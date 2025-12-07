import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";

export default async function BillingPage() {
  await requireActiveUser("/billing");
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
        <p className="mt-2 text-slate-600">Manage your subscription and credits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                Free Trial
              </span>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">10 Credits</h3>
                  <p className="text-slate-600 mt-1">Remaining this month</p>
                </div>
                <div className="w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="55"
                      textAnchor="middle"
                      className="text-2xl font-bold"
                      fill="#0f172a"
                    >
                      10
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Plan</span>
                <span className="font-medium text-slate-900">Free Trial</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Credits per month</span>
                <span className="font-medium text-slate-900">10</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Credits used</span>
                <span className="font-medium text-slate-900">0</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-600">Renewal date</span>
                <span className="font-medium text-slate-900">—</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
              <p className="text-slate-300 text-sm">Unlock unlimited job packs and premium features.</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                100 credits per month
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority AI processing
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom branding
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email support
              </li>
            </ul>

            <button
              className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Upgrade Now
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              Billing integration coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="mt-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Billing History</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No billing history</h3>
              <p className="text-slate-500">Your invoices and payment history will appear here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Have questions about billing?{" "}
          <Link href="#" className="font-medium text-amber-600 hover:text-amber-500">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

