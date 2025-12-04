import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600">Start generating AI job packs today</p>
          </div>

          {/* Placeholder form - will be replaced with real auth */}
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="John Smith"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                disabled
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                disabled
              />
            </div>
            <div>
              <label htmlFor="business" className="block text-sm font-medium text-slate-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                id="business"
                placeholder="Smith Painting Co."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                disabled
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                disabled
              />
            </div>
            <button
              type="button"
              className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Create Account
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Registration form coming soon. Check back later!
          </p>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

