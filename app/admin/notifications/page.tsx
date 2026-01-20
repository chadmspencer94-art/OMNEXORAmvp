import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import AdminNotificationsClient from "./AdminNotificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const user = await requireActiveUser("/admin/notifications");

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Navigation */}
      <div className="mb-6 flex gap-2 sm:gap-3 flex-wrap overflow-x-auto hide-scrollbar">
        <Link
          href="/admin/dashboard"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Dashboard
        </Link>
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
        <span className="px-3 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap">
          Notifications
        </span>
        <Link
          href="/admin/pricing"
          className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Pricing
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Send Notifications
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">
          Send announcements and notifications to users.
        </p>
      </div>

      {/* Client Component */}
      <AdminNotificationsClient />
    </div>
  );
}
