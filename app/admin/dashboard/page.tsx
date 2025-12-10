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

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  const data = await getAdminDashboardData();

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
      <div className="mb-6 flex gap-3 flex-wrap">
        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg">
          Dashboard
        </span>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Users
        </Link>
        <Link
          href="/admin/verification"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Verifications
        </Link>
        <Link
          href="/admin/feedback"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Feedback Log
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Overview of OMNEXORA users, jobs, verifications, and feedback.
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900">{data.users.totalUsers}</div>
          <div className="text-sm text-slate-500 mt-1">Total Users</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900">{data.jobs.totalJobs}</div>
          <div className="text-sm text-slate-500 mt-1">Total Jobs</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900">{data.users.usersLast30Days}</div>
          <div className="text-sm text-slate-500 mt-1">Users (Last 30 Days)</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900">{data.jobs.jobsLast30Days}</div>
          <div className="text-sm text-slate-500 mt-1">Jobs (Last 30 Days)</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
          </div>
        </div>

        {/* Jobs Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
        <div className="bg-white rounded-xl border border-slate-200 p-6">
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

