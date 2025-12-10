import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import { Suspense } from "react";
import AdminUsersPageContent from "./AdminUsersPageContent";

// Admin route uses cookies() via requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const user = await requireActiveUser("/admin/users");

  console.log("[admin/users] admin users page accessed by user", user?.id);

  if (!isAdmin(user)) {
    console.log("[admin/users] non-admin user attempted to access admin users page, redirecting");
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    }>
      <AdminUsersPageContent />
    </Suspense>
  );
}
