"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { featureFlags } from "@/lib/featureFlags";

interface UserInfo {
  email: string;
  emailVerifiedAt: string | null;
  verificationStatus: string | null;
  role: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Fetch current user info on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setUserInfo({
            email: data.user.email,
            emailVerifiedAt: data.user.emailVerifiedAt || null,
            verificationStatus: data.user.verificationStatus || null,
            role: data.user.role || null,
          });
        } else if (response.status === 401) {
          router.push("/login");
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {userInfo?.role === "client" ? "Client Profile" : "Settings"}
        </h1>
        <p className="text-slate-600">
          {userInfo?.role === "client" 
            ? "Manage your client profile and account settings."
            : "Manage your account settings and preferences for the Australian construction industry."}
        </p>
      </div>

      {/* Navigation Tabs - Different for clients vs tradies */}
      {userInfo?.role !== "client" && (
        <div className="mb-6 flex gap-1 border-b border-slate-200 overflow-x-auto">
          <Link
            href="/settings/business-profile"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Business Profile
          </Link>
          <Link
            href="/settings"
            className="px-4 py-2.5 text-sm font-medium text-amber-600 border-b-2 border-amber-500 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Settings
          </Link>
          <Link
            href="/settings/templates"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Job Templates
          </Link>
          {featureFlags.showRateTemplates && (
            <Link
              href="/settings/rates"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
            >
              Rate Templates
            </Link>
          )}
          {featureFlags.showMaterials && (
            <Link
              href="/settings/materials"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
            >
              Materials
            </Link>
          )}
          <Link
            href="/settings/verification"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
          >
            Verification
          </Link>
          {featureFlags.showSignature && (
            <Link
              href="/settings/signature"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-t"
            >
              Signature
            </Link>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Account Info Card */}
      {userInfo && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <p className="mt-1 text-sm text-slate-900">{userInfo.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Verification</label>
              <div className="mt-1">
                {userInfo.emailVerifiedAt ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                    ✓ Verified
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/auth/send-verification-email", {
                            method: "POST",
                          });
                          if (response.ok) {
                            alert("Verification email sent! Check your inbox.");
                          } else {
                            const data = await response.json();
                            alert(data.error || "Failed to send verification email");
                          }
                        } catch (err) {
                          alert("Failed to send verification email");
                        }
                      }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium underline"
                    >
                      Resend verification email
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Admin Verification - Only for tradies */}
            {userInfo.role !== "client" && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Verification</label>
                <div className="mt-1">
                  {userInfo.verificationStatus === "verified" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : userInfo.verificationStatus === "pending" || userInfo.verificationStatus === "pending_review" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Not verified yet
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Verified profiles help clients trust you. Submit your verification documents in the{" "}
                  <Link href="/settings/verification" className="text-amber-600 hover:text-amber-700 underline">
                    Verification
                  </Link>{" "}
                  section to get verified.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Card - Only for tradies */}
      {userInfo?.role !== "client" && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">Business Settings</h3>
              <p className="text-sm text-amber-800">
                All business profile, pricing, and rates settings for Australian construction trades have been consolidated into the{" "}
                <Link href="/settings/business-profile" className="font-medium underline hover:text-amber-900">
                  Business Profile
                </Link>{" "}
                page for easier management.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

