import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";

// Admin segment layout - all admin routes require authentication and use cookies()
// This ensures all child routes under /admin are dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

/**
 * ADMIN LAYOUT - Server-side admin route protection
 * 
 * This layout provides redundant server-side admin checks for ALL admin routes.
 * Individual pages also have their own checks, but this provides a security boundary.
 * 
 * Master admin email: chad.omnexora@outlook.com (hard-allowed via ADMIN_EMAILS)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authenticated user
  const user = await requireActiveUser("/admin");

  // Check admin privileges
  if (!isAdmin(user)) {
    console.log("[admin/layout] non-admin user attempted to access admin routes, redirecting");
    redirect("/dashboard");
  }

  return <>{children}</>;
}

