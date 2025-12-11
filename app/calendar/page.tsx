import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import { getJobsForUser } from "@/lib/jobs";
import { featureFlags } from "@/lib/featureFlags";
import OmnexoraHeader from "@/app/components/OmnexoraHeader";
import CalendarView from "./CalendarView";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireActiveUser("/calendar");

  // Check if calendar feature is enabled
  if (!featureFlags.showCalendar) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Calendar Not Available</h1>
          <p className="text-slate-600 mb-6">
            This feature isn&apos;t available yet in the current OMNEXORA pilot.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Redirect clients away from calendar
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  const params = await searchParams;
  const year = parseInt(params.year || new Date().getFullYear().toString(), 10);
  const month = parseInt(params.month || (new Date().getMonth() + 1).toString(), 10);

  // Validate month/year
  const validMonth = Math.max(1, Math.min(12, month));
  const validYear = Math.max(2020, Math.min(2100, year));

  // Load all jobs for the user (we'll filter by scheduled dates client-side)
  const allJobs = await getJobsForUser(user.id, false);

  // Filter jobs that have scheduledStartAt set
  const scheduledJobs = allJobs.filter((job) => {
    if (!job.scheduledStartAt) return false;
    
    const jobDate = new Date(job.scheduledStartAt);
    const jobYear = jobDate.getFullYear();
    const jobMonth = jobDate.getMonth() + 1;
    
    // Include jobs from current month ± 1 month for context
    const monthDiff = (jobYear - validYear) * 12 + (jobMonth - validMonth);
    return Math.abs(monthDiff) <= 1;
  });

  // Get verification status for header
  const verificationStatus = user.verificationStatus || "unverified";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brand Header */}
      <OmnexoraHeader verificationStatus={verificationStatus} />

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
            <p className="mt-2 text-slate-600">
              View your scheduled jobs by month
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            View Jobs List
          </Link>
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView
        year={validYear}
        month={validMonth}
        jobs={scheduledJobs}
      />
    </div>
  );
}

