import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const user = await requireActiveUser("/admin");

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  // Redirect to users page by default
  redirect("/admin/users");
}
