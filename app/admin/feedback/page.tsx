import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAllFeedback } from "@/lib/feedback";
import FeedbackLogClient from "./FeedbackLogClient";

export default async function AdminFeedbackPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin/feedback");
  }

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  const feedbackEntries = await getAllFeedback();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Navigation */}
      <div className="mb-6 flex gap-3">
        <Link
          href="/admin/verification"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Verifications
        </Link>
        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg">
          Feedback Log
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Feedback Log</h1>
        <p className="mt-2 text-slate-600">
          {feedbackEntries.length === 0
            ? "No feedback received yet."
            : `${feedbackEntries.length} feedback ${feedbackEntries.length === 1 ? "entry" : "entries"} • ${feedbackEntries.filter(f => !f.resolved).length} unresolved`}
        </p>
      </div>

      {feedbackEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No feedback yet</h3>
          <p className="text-slate-500">Feedback from users will appear here.</p>
        </div>
      ) : (
        <FeedbackLogClient initialFeedback={feedbackEntries} />
      )}
    </div>
  );
}

