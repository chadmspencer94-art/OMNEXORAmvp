"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/app/components/Footer";
import { ChevronDown } from "lucide-react";

// Client signup is disabled - only tradies can register
type UserRole = "tradie";

// All implemented trades
const TRADE_TYPES = [
  { value: "Painter", label: "Painter" },
  { value: "Plasterer", label: "Plasterer" },
  { value: "Carpenter", label: "Carpenter" },
  { value: "Electrician", label: "Electrician" },
  { value: "Plumber", label: "Plumber" },
  { value: "Roofer", label: "Roofer" },
  { value: "Tiler", label: "Tiler" },
  { value: "Concreter", label: "Concreter" },
  { value: "HVAC", label: "HVAC Technician" },
  { value: "Flooring", label: "Flooring Installer" },
  { value: "Landscaper", label: "Landscaper" },
  { value: "Other", label: "Other Trade" },
] as const;

// Australian states and territories
const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales (NSW)" },
  { value: "VIC", label: "Victoria (VIC)" },
  { value: "QLD", label: "Queensland (QLD)" },
  { value: "WA", label: "Western Australia (WA)" },
  { value: "SA", label: "South Australia (SA)" },
  { value: "TAS", label: "Tasmania (TAS)" },
  { value: "ACT", label: "Australian Capital Territory (ACT)" },
  { value: "NT", label: "Northern Territory (NT)" },
] as const;

interface RegisterPageClientProps {
  requireInviteCode: boolean;
}

export default function RegisterPageClient({ requireInviteCode }: RegisterPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [state, setState] = useState("");
  // Role is fixed to tradie - client signup is disabled
  const role: UserRole = "tradie";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!tradeType) {
      setError("Please select your trade type");
      return;
    }

    if (!state) {
      setError("Please select your state");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password, 
          role, 
          inviteCode: inviteCode.trim() || undefined,
          tradeType,
          state,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/auth-hero-bg.png"
          alt="OMNEXORA - Create your account"
          className="w-full h-full object-cover"
          style={{ 
            objectFit: 'cover',
            objectPosition: 'center',
            minWidth: '100%',
            minHeight: '100%'
          }}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-sm text-slate-600">Start creating job packs and quotes today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Invite Code Field - always shown, required in invite-only mode, optional otherwise */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700 mb-1.5">
                Invite Code {requireInviteCode && <span className="text-red-500">*</span>}
                {!requireInviteCode && <span className="text-slate-400 font-normal text-xs">(optional)</span>}
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={requireInviteCode ? "Enter your invite code" : "Have a founder code?"}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                required={requireInviteCode}
                disabled={isLoading}
              />
            </div>

            {/* Trade Type Dropdown */}
            <div>
              <label htmlFor="tradeType" className="block text-sm font-medium text-slate-700 mb-1.5">
                Trade Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="tradeType"
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select your trade</option>
                  {TRADE_TYPES.map((trade) => (
                    <option key={trade.value} value={trade.value}>
                      {trade.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Your profile will be configured with trade-specific rates and compliance info
              </p>
            </div>

            {/* State Dropdown */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">
                State / Territory <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select your state</option>
                  {AUSTRALIAN_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Documents will comply with your state&apos;s regulations
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                required
                minLength={8}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors shadow-lg shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
