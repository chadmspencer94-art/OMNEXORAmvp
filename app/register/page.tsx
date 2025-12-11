import Link from "next/link";
import { getSignupMode } from "@/lib/signup-config";
import RegisterPageClient from "./RegisterPageClient";

export default async function RegisterPage() {
  const signupMode = getSignupMode();

  // If signup is closed, show message instead of form
  if (signupMode === "closed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
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
    );
  }

  // Otherwise, render the registration form (invite-only or open)
  const requireInviteCode = signupMode === "invite-only";
  return <RegisterPageClient requireInviteCode={requireInviteCode} />;
}
