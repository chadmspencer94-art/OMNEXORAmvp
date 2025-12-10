import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import { getJobsForUser } from "@/lib/jobs";
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

