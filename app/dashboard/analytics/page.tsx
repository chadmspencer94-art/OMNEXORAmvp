import { requireOnboardedUser } from "@/lib/authChecks";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import AdvancedAnalyticsClient from "./AdvancedAnalyticsClient";
import { ArrowLeft, Crown, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AdvancedAnalyticsPage() {
  const user = await requireOnboardedUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50">
      <OmnexoraHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 mb-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Advanced Analytics</h1>
                  <p className="text-slate-400 mt-1">Business performance & public rating insights</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-400/20 border border-amber-500/30 rounded-full px-4 py-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Premium Feature</span>
            </div>
          </div>
          
          <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-sm">Your Score Affects</p>
              <p className="text-white font-medium mt-1">Public Profile Rating</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-sm">Unlocks</p>
              <p className="text-white font-medium mt-1">Job Matching Priority</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-sm">Coming Soon</p>
              <p className="text-white font-medium mt-1">Client Marketplace</p>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <AdvancedAnalyticsClient primaryTrade={user.primaryTrade || null} />
      </main>
    </div>
  );
}
