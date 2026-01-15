"use client";

import Link from "next/link";
import { FileText, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

interface TileProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count?: number;
}

/**
 * Dashboard tile component optimized for mobile touch
 * - Larger touch target with min-height
 * - Better active states for touch feedback
 */
function DashboardTile({ href, icon, title, description, count }: TileProps) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] active:bg-slate-50 touch-manipulation min-h-[80px]"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-14 h-14 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {count !== undefined && (
              <span className="flex-shrink-0 text-2xl font-bold text-amber-600">{count}</span>
            )}
          </div>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

interface MobileDashboardTilesProps {
  totalJobs: number;
  totalQuotes: number;
  completedJobs: number;
}

export default function MobileDashboardTiles({
  totalJobs,
  totalQuotes,
  completedJobs,
}: MobileDashboardTilesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 mb-8">
      <DashboardTile
        href="/jobs"
        icon={<FileText className="w-6 h-6 text-amber-600" />}
        title="Jobs"
        description="View and manage all your job packs"
        count={totalJobs}
      />
      <DashboardTile
        href="/dashboard/quotes"
        icon={<DollarSign className="w-6 h-6 text-amber-600" />}
        title="Quotes"
        description="Track quotes and client responses"
        count={totalQuotes}
      />
      <DashboardTile
        href="/dashboard/performance"
        icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
        title="Performance"
        description="Analytics and job completion metrics"
        count={completedJobs}
      />
      <DashboardTile
        href="/dashboard/usage"
        icon={<BarChart3 className="w-6 h-6 text-amber-600" />}
        title="Usage"
        description="Credits, activity, and subscription details"
      />
    </div>
  );
}

