"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import OvisBadge from "@/app/components/OvisBadge";
import OvisModal from "@/app/components/OvisModal";

export default function Home() {
  const [isOvisModalOpen, setIsOvisModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Placeholder for auth state - will be replaced with real auth later
  const isLoggedIn = false;

  return (
    <main className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section 
        ref={heroRef}
        className="relative bg-slate-900"
      >
        {/* Background Image - Full, Uncropped, 85% opacity */}
        <img
          src="/hero-bg.png"
          alt="OMNEXORA - Your clients get better. Your team gets faster. Your head gets quieter."
          className="w-full h-[105%] object-cover object-top block opacity-85"
        />

        {/* CTA Buttons Overlay - positioned near top of hero */}
        <div className="absolute top-[3%] sm:top-[5%] md:top-[7%] left-0 right-0 z-10 flex flex-col items-center px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-2 sm:mb-2.5 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto sm:mx-0">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-xs sm:text-sm md:text-base font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
              >
                Go to Dashboard
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ml-1.5 sm:ml-2"
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
                  className="inline-flex items-center justify-center px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-xs sm:text-sm md:text-base font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Get started
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ml-1.5 sm:ml-2"
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
                  className="inline-flex items-center justify-center px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-xs sm:text-sm md:text-base font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
          
          {/* OVIS Trust Strip */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-900/40 backdrop-blur-sm px-2 sm:px-2.5 py-1 sm:py-1 rounded-full border border-white/30">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white drop-shadow-lg">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="drop-shadow-md">OVIS Checked</span>
            </span>
            <button
              onClick={() => setIsOvisModalOpen(true)}
              className="p-0.5 text-amber-400 hover:text-amber-300 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900/40"
              aria-label="What is OVIS?"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>


      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-28 bg-white">
        <div className="w-full max-w-6xl mx-auto">
          {/* Small CTA Buttons - above section header */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 md:mb-14">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log in
                </Link>
              </>
            )}
          </div>

          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-14 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 mb-4 sm:mb-5 tracking-tight">
              Everything You Need, All in One Place
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-7 leading-relaxed">
              Streamline your workflow with AI-powered job packs, quotes, and safety docs.
            </p>
            {/* OVIS Checked Badge */}
            <div className="flex justify-center">
              <OvisBadge variant="card" size="md" />
            </div>
          </div>

          {/* Core Features Grid */}
          <div className="mb-12 sm:mb-14 md:mb-16">
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6 sm:mb-8 text-center">Core Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Feature 1: Job Pack Creation */}
              <div className="bg-white rounded-lg border border-slate-100 p-5 sm:p-6 hover:border-slate-200 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Job Pack Creation
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Generate comprehensive job packs effortlessly with AI assistance.
                  </p>
                </div>
              </div>

              {/* Feature 2: Smart Quote Helper */}
              <div className="bg-white rounded-lg border border-slate-100 p-5 sm:p-6 hover:border-slate-200 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-5m-6 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Smart Quote Helper
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Local pricing integration to help you create quotes faster.
                  </p>
                </div>
              </div>

              {/* Feature 3: Compliance-Ready Tools */}
              <div className="bg-white rounded-lg border border-slate-100 p-5 sm:p-6 hover:border-slate-200 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Compliance-Ready Tools
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Built-in Australian standards to keep your documentation organized and compliant.
                  </p>
                </div>
              </div>

              {/* Feature 4: AI-Powered Assistance */}
              <div className="bg-white rounded-lg border border-slate-100 p-5 sm:p-6 hover:border-slate-200 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    AI-Powered Assistance
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Leverage AI to reduce admin time by up to 80% and improve accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-12 sm:mb-14 md:mb-16">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 mb-8 sm:mb-10 text-center">Benefits</h3>
            {/* OVIS Checked Badge */}
            <div className="flex justify-center mb-8 sm:mb-10">
              <OvisBadge variant="card" size="md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
              <div className="text-center bg-white rounded-lg p-6 sm:p-7 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-50 mb-4 sm:mb-5">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl">Save Time</h4>
                <p className="text-sm sm:text-base text-slate-600">Reduce administrative tasks and focus on on-site work.</p>
              </div>
              <div className="text-center bg-white rounded-lg p-6 sm:p-7 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 mb-4 sm:mb-5">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl">Work Smarter</h4>
                <p className="text-sm sm:text-base text-slate-600">AI-powered tools help you stay ahead and efficient.</p>
              </div>
              <div className="text-center bg-white rounded-lg p-6 sm:p-7 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-50 mb-4 sm:mb-5">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl">Stay Compliant</h4>
                <p className="text-sm sm:text-base text-slate-600">Australian standards and best practices built in for peace of mind.</p>
              </div>
            </div>
          </div>

          {/* What's Available Now vs. Coming Soon */}
          <div className="bg-slate-50 rounded-lg border border-slate-100 p-6 sm:p-8 md:p-10">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 mb-8 sm:mb-10 text-center">What's Available</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500"></div>
                  <h4 className="font-semibold text-slate-900 text-base sm:text-lg md:text-xl">Available Now</h4>
                </div>
                <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-600">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Job packs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Quotes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Compliance tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI assistance</span>
                  </li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500"></div>
                  <h4 className="font-semibold text-slate-900 text-base sm:text-lg md:text-xl">Coming Soon</h4>
                </div>
                <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-600">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Affiliate programs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Advanced supplier pricing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Additional features</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-14 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 text-white">OMNEXORA</h2>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                AI-powered job packs for<br />
                Australian tradies. Less<br />
                paperwork, more time for<br />
                <span className="font-bold text-amber-400">what matters most</span>.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300">
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  OVIS Checked
                </span>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/register" className="text-slate-300 hover:text-white transition-colors text-sm">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-300 hover:text-white transition-colors text-sm">
                    Sign In
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => setIsOvisModalOpen(true)}
                    className="text-slate-300 hover:text-white transition-colors text-sm text-left"
                  >
                    What is OVIS?
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://v0-omnexora-marketing-website.vercel.app/about" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a 
                    href="https://v0-omnexora-marketing-website.vercel.app/contact" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a 
                    href="https://v0-omnexora-marketing-website.vercel.app/contact" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    Pilot Program <span className="text-slate-500 text-xs">(Contact us for more)</span>
                  </a>
                </li>
                <li>
                  <span className="text-slate-500 text-sm">Partner with Us <span className="text-xs">(Launching soon)</span></span>
                </li>
                <li>
                  <span className="text-slate-500 text-sm">Affiliates <span className="text-xs">(Coming soon)</span></span>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-slate-500 text-sm">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-slate-500 text-sm">Terms of Service</span>
                </li>
              </ul>
            </div>

            {/* Join our Community */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Join our Community</h3>
              <div className="flex gap-4">
                {/* Facebook - Coming Soon */}
                <div className="relative group">
                  <span className="text-slate-500 cursor-not-allowed" title="Coming soon">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>

                {/* Instagram - Coming Soon */}
                <div className="relative group">
                  <span className="text-slate-500 cursor-not-allowed" title="Coming soon">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>

                {/* WhatsApp - Coming Soon */}
                <div className="relative group">
                  <span className="text-slate-500 cursor-not-allowed" title="Coming soon">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </span>
                </div>

                {/* TikTok - Active Link */}
                <a 
                  href="https://www.tiktok.com/@omnexora" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors"
                  aria-label="Follow us on TikTok"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-xs sm:text-sm text-center sm:text-left">
                © {new Date().getFullYear()} OMNEXORA. All rights reserved.
              </p>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <span>Built for</span>
                <span className="text-amber-500 font-medium">Australian Tradies</span>
                <span className="mx-1">🇦🇺</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* OVIS Modal */}
      <OvisModal isOpen={isOvisModalOpen} onClose={() => setIsOvisModalOpen(false)} />
    </main>
  );
}
