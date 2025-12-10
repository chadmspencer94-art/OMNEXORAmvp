import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import { Suspense } from "react";
import AdminVerificationPageContent from "./AdminVerificationPageContent";

// Admin route uses cookies() via requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function AdminVerificationPage() {
  const user = await requireActiveUser("/admin/verification");

  console.log("[admin/verification] admin verification page accessed by user", user?.id);

  if (!isAdmin(user)) {
    console.log("[admin/verification] non-admin user attempted to access admin verification page, redirecting");
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    }>
      <AdminVerificationPageContent />
    </Suspense>
  );
}
