"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import OvisBadge from "@/app/components/OvisBadge";
import OvisModal from "@/app/components/OvisModal";
import {
  FileText,
  Calculator,
  Shield,
  Sparkles,
  Clock,
  Zap,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Play,
  Users,
  Star,
  TrendingUp,
  Briefcase,
  Target,
  Rocket,
} from "lucide-react";

export default function Home() {
  const [isOvisModalOpen, setIsOvisModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Placeholder for auth state - will be replaced with real auth later
  const isLoggedIn = false;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: FileText,
      title: "AI Job Packs",
      description: "Generate comprehensive job packs with AI-powered assistance in minutes, not hours.",
      color: "amber",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: Calculator,
      title: "Smart Quoting",
      description: "Local pricing integration helps you create accurate quotes faster than ever.",
      color: "blue",
      gradient: "from-blue-400 to-indigo-500",
    },
    {
      icon: Shield,
      title: "Compliance Tools",
      description: "AU/WA compliant templates keep you covered. Generate safety docs instantly.",
      color: "emerald",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Leverage AI to reduce admin time, improve accuracy, and work smarter.",
      color: "purple",
      gradient: "from-purple-400 to-pink-500",
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Save 5+ Hours Weekly",
      description: "Slash admin time and get back to what you love — actual work on-site.",
      stat: "5+",
      statLabel: "Hours saved",
    },
    {
      icon: Zap,
      title: "Quote 3x Faster",
      description: "AI-powered tools mean faster turnaround and more jobs won.",
      stat: "3x",
      statLabel: "Faster quoting",
    },
    {
      icon: Shield,
      title: "Stay Compliant",
      description: "Never worry about paperwork compliance again. We've got you covered.",
      stat: "100%",
      statLabel: "AU Compliant",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up in under 2 minutes. No credit card required to get started.",
    },
    {
      number: "02",
      title: "Enter Job Details",
      description: "Describe the job and let AI generate comprehensive packs and quotes.",
    },
    {
      number: "03",
      title: "Send & Win",
      description: "Professional documents impress clients and help you win more work.",
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        </div>

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          {/* OVIS Trust Badge */}
          <div className="flex justify-center pt-6 sm:pt-8 px-4">
            <button
              onClick={() => setIsOvisModalOpen(true)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-white/10 backdrop-blur-md border border-white/20
                text-white text-sm font-medium
                hover:bg-white/20 transition-all duration-300
                transform ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
              `}
              style={{ transitionDelay: "100ms" }}
            >
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>OVIS Checked Platform</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Hero Content */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-28 text-center">
            <h1 
              className={`
                text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white
                leading-[1.1] tracking-tight mb-6
                transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
                transition-all duration-700 ease-out
              `}
              style={{ transitionDelay: "200ms" }}
            >
              Less Paperwork.{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                  More Building.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8 Q 75 2 150 8 Q 225 14 298 8" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="100%" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
                      <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p 
              className={`
                text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10
                leading-relaxed
                transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
                transition-all duration-700 ease-out
              `}
              style={{ transitionDelay: "300ms" }}
            >
              AI-powered job packs, quotes, and compliance docs for Australian tradies.
              <span className="text-white font-medium"> Get back hours every week.</span>
            </p>

            {/* CTA Buttons */}
            <div 
              className={`
                flex flex-col sm:flex-row items-center justify-center gap-4 mb-12
                transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
                transition-all duration-700 ease-out
              `}
              style={{ transitionDelay: "400ms" }}
            >
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div 
              className={`
                flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-400
                transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
                transition-all duration-700 ease-out
              `}
              style={{ transitionDelay: "500ms" }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Free during pilot</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Mockup */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12">
            <div 
              className={`
                relative rounded-t-2xl sm:rounded-t-3xl overflow-hidden shadow-2xl shadow-black/50
                transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}
                transition-all duration-1000 ease-out
              `}
              style={{ transitionDelay: "600ms" }}
            >
              <img
                src="/hero-bg.png"
                alt="OMNEXORA Dashboard - AI-powered job management for tradies"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Win More Jobs
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Streamline your entire workflow — from first quote to final invoice.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] rounded-2xl transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-amber-100/50 to-transparent rounded-full blur-3xl -z-10" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Real Results</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Why Tradies{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Love OMNEXORA
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Join hundreds of Australian tradies who are working smarter, not harder.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-slate-900">{benefit.stat}</div>
                      <div className="text-sm text-slate-500">{benefit.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* OVIS Badge */}
          <div className="flex justify-center mt-12">
            <OvisBadge variant="card" size="md" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
              <Rocket className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Get Started Fast</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Up and Running in{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              No complex setup. No long onboarding. Just results.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(100%-1rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-amber-500/50 to-transparent z-0" />
                )}
                
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:bg-white/10">
                  <div className="text-6xl font-bold text-amber-500/20 mb-4">{step.number}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Available Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200 p-8 sm:p-10 lg:p-12 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl -z-0" />
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  What&apos;s Available
                </h2>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                  Features ready to use today and exciting additions coming soon.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Available Now */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-slate-900 text-xl">Available Now</h3>
                  </div>
                  <ul className="space-y-4">
                    {["AI-Powered Job Packs", "Smart Quote Generation", "Compliance Documents", "Client Management", "PDF Export"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coming Soon */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <h3 className="font-bold text-slate-900 text-xl">Coming Soon</h3>
                  </div>
                  <ul className="space-y-4">
                    {["Supplier Price Integration", "Team Collaboration", "Affiliate Programs", "Mobile App", "Advanced Analytics"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-slate-50 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
            <Target className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Limited Pilot Program</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Ready to Work{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Smarter?
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join Australian tradies who are saving hours every week with AI-powered job management. 
            Free during pilot — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://www.omnexora.com.au/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              Talk to Us
            </a>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Have questions? Email us at{" "}
            <a href="mailto:support@omnexora.com.au" className="text-amber-600 hover:text-amber-700 font-medium">
              support@omnexora.com.au
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-white">OMNEXORA</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs mx-auto lg:mx-0">
                AI-powered job packs for Australian tradies. Less paperwork, more time for{" "}
                <span className="font-semibold text-amber-400">what matters most</span>.
              </p>
              <div className="flex items-center justify-center lg:justify-start">
                <button
                  onClick={() => setIsOvisModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-xs font-medium text-slate-300 border border-slate-700 hover:border-amber-500/50 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  OVIS Checked
                </button>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/register" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                    Sign In
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => setIsOvisModalOpen(true)}
                    className="text-slate-400 hover:text-amber-400 transition-colors text-sm text-left"
                  >
                    What is OVIS?
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://www.omnexora.com.au/about" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.omnexora.com.au/contact" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.omnexora.com.au/contact" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    Pilot Program
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://www.omnexora.com.au/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.omnexora.com.au/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center lg:text-left">Follow Us</h3>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {/* Facebook */}
                <a 
                  href="https://www.facebook.com/profile.php?id=61586192848393" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-slate-900 transition-all duration-200 border border-slate-700"
                  aria-label="Follow us on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/omnexora.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-pink-500 hover:text-white transition-all duration-200 border border-slate-700"
                  aria-label="Follow us on Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a 
                  href="https://chat.whatsapp.com/KXAqMNzF2z30crzkW7tAPO" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all duration-200 border border-slate-700"
                  aria-label="Join our WhatsApp group"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a 
                  href="https://www.tiktok.com/@omnexora" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-950 hover:text-white transition-all duration-200 border border-slate-700"
                  aria-label="Follow us on TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>

                {/* Skool */}
                <a 
                  href="https://www.skool.com/australian-construction-7759/about" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-200 border border-slate-700"
                  aria-label="Join our Skool community"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
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
              <p className="text-slate-500 text-sm text-center sm:text-left">
                © {new Date().getFullYear()} OMNEXORA. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span>Built with ❤️ for</span>
                <span className="text-amber-500 font-semibold">Australian Tradies</span>
                <span className="text-lg">🇦🇺</span>
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
