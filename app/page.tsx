"use client";

import { useState } from "react";
import Link from "next/link";
import OvisBadge from "@/app/components/OvisBadge";
import OvisModal from "@/app/components/OvisModal";

export default function Home() {
  const [isOvisModalOpen, setIsOvisModalOpen] = useState(false);
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
              Built for Australian tradies
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            OMNEXORA
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-700 mb-6 max-w-xl mx-auto leading-relaxed font-medium">
            Win back time for what matters most.
          </p>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            OMNEXORA helps you create job packs, quotes and safety documents in minutes – so you can spend less time on paperwork and more time on the tools.
          </p>

          {/* Primary CTA */}
          <div className="mb-6">
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
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-lg shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 mr-4"
                >
                  Get started
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
                <Link
                  href="/login"
                  className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-slate-900 border-2 border-slate-300 hover:border-slate-400 rounded-xl transition-colors"
                >
                  Log in
                </Link>
              </>
            )}
          </div>

          {/* OVIS Trust Strip */}
          <div className="mb-12 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center justify-center gap-3">
              <OvisBadge variant="inline" size="sm" />
              <button
                onClick={() => setIsOvisModalOpen(true)}
                className="text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors text-xs sm:text-sm"
              >
                What is OVIS?
              </button>
            </div>
            <p className="hidden md:block text-xs text-slate-500">
              AI-assisted drafts with human verification before issue.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 sm:py-16 lg:py-20 border-t border-slate-200 bg-slate-50/50">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 text-left">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-base sm:text-lg">
                Job packs, quotes and safety docs in one place
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Less admin. More on-site.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-base sm:text-lg">
                Smart quote helper
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Automatic pack generation based on your job details and local pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OVIS Modal */}
      <OvisModal isOpen={isOvisModalOpen} onClose={() => setIsOvisModalOpen(false)} />
    </main>
  );
}
