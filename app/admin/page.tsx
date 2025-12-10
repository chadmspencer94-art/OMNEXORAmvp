import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";

// Admin route uses cookies() via requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function AdminPage() {
  const user = await requireActiveUser("/admin");

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  // Redirect to dashboard by default
  redirect("/admin/dashboard");
}
