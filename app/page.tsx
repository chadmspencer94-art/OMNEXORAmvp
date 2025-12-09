import Link from "next/link";

export default function Home() {
  // Placeholder for auth state - will be replaced with real auth later
  const isLoggedIn = false;

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 lg:py-24">
        <div className="w-full max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
              Built for Australian Tradies
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            OMNEXORA
          </h1>

          {/* Sub-heading */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-amber-500 mb-5 leading-snug">
            AI Job Packs for Tradies
          </h2>

          {/* Tagline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-700 mb-6 max-w-xl mx-auto leading-relaxed font-medium">
            win back time for what most matters
          </p>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Generate professional job packs in minutes. From quotes to scope of work, 
            let AI handle the paperwork so you can focus on what you do best.
          </p>

          {/* SWMS Highlight - Refined as a clean notice card */}
          <div className="mb-10 max-w-xl mx-auto">
            <div className="inline-flex items-start gap-3 px-4 py-3 bg-amber-50/50 border border-amber-200/60 rounded-lg shadow-sm text-left">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-0.5">
                  New: Generate SWMS
                </p>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  Safe Work Method Statements directly in your job packs. 
                  AI-powered safety documentation for every job.
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="mb-12">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-lg shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Go to Dashboard
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-lg shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Login to Get Started
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 sm:py-16 lg:py-20 border-t border-slate-200 bg-slate-50/50">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 text-left">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-base sm:text-lg">
                Smart Quotes
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                AI-generated quotes based on your job details and local pricing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-base sm:text-lg">
                Scope of Work
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Detailed breakdown of tasks, materials, and timelines.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-base sm:text-lg">
                SWMS Generation
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                AI-powered Safe Work Method Statements included in every job pack.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
