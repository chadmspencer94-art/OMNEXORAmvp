import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Account Suspended</h1>

          {/* Message */}
          <p className="text-slate-600 mb-8">
            Your OMNEXORA account has been suspended. Please contact support if you believe this is a mistake.
          </p>

          {/* Back to home button */}
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

