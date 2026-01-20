import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/adminDashboard";

// Admin route uses cookies() via requireActiveUser and Prisma - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const user = await requireActiveUser("/admin/dashboard");

  console.log("[admin] dashboard page accessed by user", user?.id);

  if (!isAdmin(user)) {
    console.log("[admin] non-admin user attempted to access admin dashboard, redirecting");
    redirect("/dashboard");
  }

  let data;
  try {
    data = await getAdminDashboardData();
    console.log("[admin] Dashboard data fetched successfully:", {
      totalUsers: data.users.totalUsers,
      totalJobs: data.jobs.totalJobs,
      pendingVerifications: data.verifications.pendingCount,
      openFeedback: data.feedback.openCount,
    });
  } catch (error) {
    console.error("[admin] Error fetching admin dashboard data:", error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("[admin] Error message:", error.message);
      console.error("[admin] Error stack:", error.stack);
    }
    // Return empty data structure instead of crashing
    // The function now handles partial failures internally, so this should rarely happen
    data = {
      users: {
        totalUsers: 0,
        totalClients: 0,
        totalTradies: 0,
        totalAdmins: 0,
        usersByPlan: [],
        usersLast7Days: 0,
        usersLast30Days: 0,
      },
      jobs: {
        totalJobs: 0,
        jobsLast7Days: 0,
        jobsLast30Days: 0,
        jobsByStatus: [],
        jobsByClientStatus: [],
      },
      verifications: {
        pendingCount: 0,
        pendingList: [],
      },
      feedback: {
        openCount: 0,
        recentOpen: [],
      },
    };
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "draft":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "booked":
      case "sent":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "completed":
      case "accepted":
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelled":
      case "declined":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getFeedbackTypeBadgeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "bug":
        return "bg-red-100 text-red-700 border-red-300";
      case "idea":
      case "feature":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "question":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Navigation */}
      <div className="mb-6 flex gap-2 sm:gap-3 flex-wrap overflow-x-auto hide-scrollbar">
        <span className="px-3 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap">
          Dashboard
        </span>
        <Link
          href="/admin/users"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Users
        </Link>
        <Link
          href="/admin/verification"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Verifications
        </Link>
        <Link
          href="/admin/feedback"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Feedback Log
        </Link>
        <Link
          href="/admin/notifications"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Notifications
        </Link>
        <Link
          href="/admin/pricing"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Pricing
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">
          Overview of OMNEXORA users, jobs, verifications, and feedback.
        </p>
      </div>

      {/* Top Stats Grid - Mobile: scrollable row, Desktop: full grid */}
      <div className="mb-8">
        {/* Mobile: Horizontal scroll with snap */}
        <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden hide-scrollbar snap-x snap-mandatory">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white flex-shrink-0 w-[140px] snap-start">
            <div className="text-2xl font-bold">{data.users.totalUsers}</div>
            <div className="text-xs text-purple-100 mt-1">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white flex-shrink-0 w-[140px] snap-start">
            <div className="text-2xl font-bold">{data.analytics.founderUsers}</div>
            <div className="text-xs text-amber-100 mt-1">⭐ Founders</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white flex-shrink-0 w-[140px] snap-start">
            <div className="text-2xl font-bold">{data.jobs.totalJobs}</div>
            <div className="text-xs text-emerald-100 mt-1">Total Jobs</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-shrink-0 w-[140px] snap-start">
            <div className="text-2xl font-bold text-slate-900">{data.users.activeLastWeek}</div>
            <div className="text-xs text-slate-500 mt-1">Active (7d)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-shrink-0 w-[140px] snap-start">
            <div className="text-2xl font-bold text-slate-900">{data.users.usersLast30Days}</div>
            <div className="text-xs text-slate-500 mt-1">New (30d)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-shrink-0 w-[140px] snap-start">
            <div className="text-2xl font-bold text-slate-900">{data.jobs.jobsLast30Days}</div>
            <div className="text-xs text-slate-500 mt-1">Jobs (30d)</div>
          </div>
        </div>
        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <div className="text-3xl font-bold">{data.users.totalUsers}</div>
            <div className="text-sm text-purple-100 mt-1">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <div className="text-3xl font-bold">{data.analytics.founderUsers}</div>
            <div className="text-sm text-amber-100 mt-1">⭐ Founders</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="text-3xl font-bold">{data.jobs.totalJobs}</div>
            <div className="text-sm text-emerald-100 mt-1">Total Jobs</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">{data.users.activeLastWeek}</div>
            <div className="text-sm text-slate-500 mt-1">Active (7d)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">{data.users.usersLast30Days}</div>
            <div className="text-sm text-slate-500 mt-1">New (30d)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">{data.jobs.jobsLast30Days}</div>
            <div className="text-sm text-slate-500 mt-1">Jobs (30d)</div>
          </div>
        </div>
      </div>

      {/* Email & Verification Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-xl font-bold text-green-900">{data.users.emailVerified}</div>
          <div className="text-[10px] sm:text-xs text-green-700">Email Verified</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-xl font-bold text-amber-900">{data.users.emailUnverified}</div>
          <div className="text-[10px] sm:text-xs text-amber-700">Email Unverified</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-xl font-bold text-blue-900">{data.verifications.verifiedCount}</div>
          <div className="text-[10px] sm:text-xs text-blue-700">Biz Verified</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
          <div className="text-lg sm:text-xl font-bold text-red-900">{data.verifications.pendingCount}</div>
          <div className="text-[10px] sm:text-xs text-red-700">Pending Review</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Users Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            <Link
              href="/admin/users"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Users by Role</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Clients</span>
                  <span className="text-sm font-semibold text-slate-900">{data.users.totalClients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Tradies/Business</span>
                  <span className="text-sm font-semibold text-slate-900">{data.users.totalTradies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Admins</span>
                  <span className="text-sm font-semibold text-slate-900">{data.users.totalAdmins}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Users by Plan</h3>
              <div className="space-y-2">
                {data.users.usersByPlan.length > 0 ? (
                  data.users.usersByPlan.map(({ planTier, count }) => (
                    <div key={planTier} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{planTier}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No plan data available</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Users (Last 7 Days)</span>
                <span className="text-sm font-semibold text-slate-900">{data.users.usersLast7Days}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Signup Source</h3>
              <div className="space-y-2">
                {data.users.usersBySignupSource.length > 0 ? (
                  data.users.usersBySignupSource.map(({ source, count }) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded border ${
                        source.includes("FOUNDER") 
                          ? "bg-amber-100 text-amber-700 border-amber-300" 
                          : source === "INVITE_CODE"
                            ? "bg-purple-100 text-purple-700 border-purple-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}>
                        {source === "FOUNDER_CODE" ? "⭐ Founder Code" :
                         source === "FOUNDER_EMAIL" ? "⭐ Founder Email" :
                         source === "INVITE_CODE" ? "Invite Code" :
                         source === "ORGANIC" ? "Organic" : source}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No signup source data</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">User Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active (Last 7d)</span>
                  <span className="text-sm font-semibold text-slate-900">{data.users.activeLastWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active (Last 30d)</span>
                  <span className="text-sm font-semibold text-slate-900">{data.users.activeLastMonth}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Jobs</h2>
            <Link
              href="/jobs"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Jobs by Status</h3>
              <div className="space-y-2">
                {data.jobs.jobsByStatus.length > 0 ? (
                  data.jobs.jobsByStatus.map(({ status, count }) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusBadgeColor(status)}`}>
                        {status}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No jobs found</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Jobs by Client Status</h3>
              <div className="space-y-2">
                {data.jobs.jobsByClientStatus.length > 0 ? (
                  data.jobs.jobsByClientStatus.map(({ clientStatus, count }) => (
                    <div key={clientStatus} className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusBadgeColor(clientStatus)}`}>
                        {clientStatus}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No client status data</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Jobs (Last 7 Days)</span>
                <span className="text-sm font-semibold text-slate-900">{data.jobs.jobsLast7Days}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verifications Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Verification Queue</h2>
            {data.verifications.pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                {data.verifications.pendingCount}
              </span>
            )}
          </div>

          {data.verifications.pendingCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No pending verification requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.verifications.pendingList.map((verification) => (
                <div
                  key={verification.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {verification.businessName || "No business name"}
                      </p>
                      {verification.primaryTrade && (
                        <p className="text-xs text-slate-500 mt-1">{verification.primaryTrade}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(verification.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/admin/verification/${verification.userId}`}
                      className="ml-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
              {data.verifications.pendingCount > data.verifications.pendingList.length && (
                <Link
                  href="/admin/verification"
                  className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium pt-2"
                >
                  View all pending ({data.verifications.pendingCount}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Feedback Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Feedback & Issues</h2>
            {data.feedback.openCount > 0 && (
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {data.feedback.openCount} open
              </span>
            )}
          </div>

          {data.feedback.openCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No open feedback or issues.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.feedback.recentOpen.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getFeedbackTypeBadgeColor(item.type)}`}
                    >
                      {item.type || "Other"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 mb-1 line-clamp-2">{item.title}</p>
                  {item.userEmail && (
                    <p className="text-xs text-slate-500">From: {item.userEmail}</p>
                  )}
                  <Link
                    href="/admin/feedback"
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
                  >
                    View details →
                  </Link>
                </div>
              ))}
              {data.feedback.openCount > data.feedback.recentOpen.length && (
                <Link
                  href="/admin/feedback"
                  className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium pt-2"
                >
                  View all open ({data.feedback.openCount}) →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

