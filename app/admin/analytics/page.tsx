import { requireAdmin } from "@/lib/authChecks";
import AdminAdvancedAnalyticsClient from "./AdminAdvancedAnalyticsClient";
import { ArrowLeft, Crown, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function AdminAdvancedAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Premium Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Admin Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Platform Analytics</h1>
                <p className="text-slate-400 mt-1">Complete platform performance & insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-full px-4 py-2">
              <Crown className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">Admin Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminAdvancedAnalyticsClient />
      </main>
    </div>
  );
}
