import Link from "next/link";
import { getSignupMode } from "@/lib/signup-config";
import RegisterPageClient from "./RegisterPageClient";
import Footer from "@/app/components/Footer";

export default async function RegisterPage() {
  const signupMode = getSignupMode();

  // If signup is closed, show message instead of form
  if (signupMode === "closed") {
    return (
      <div className="relative min-h-screen bg-slate-900 overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/auth-hero-bg.png"
            alt="OMNEXORA - Registrations Closed"
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
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Registrations Closed</h1>
              <p className="text-slate-600 mb-6">
                Registrations are currently closed. Please contact support.
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Otherwise, render the registration form (invite-only or open)
  const requireInviteCode = signupMode === "invite-only";
  return <RegisterPageClient requireInviteCode={requireInviteCode} />;
}
