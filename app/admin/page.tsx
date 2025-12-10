import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";

// Admin route uses cookies() via requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function AdminPage() {
  const user = await requireActiveUser("/admin");

  console.log("[admin] admin page accessed by user", user?.id);

  if (!isAdmin(user)) {
    console.log("[admin] non-admin user attempted to access admin page, redirecting");
    redirect("/dashboard");
  }

  // Redirect to dashboard by default
  redirect("/admin/dashboard");
}
