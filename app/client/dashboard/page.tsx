import { redirect } from "next/navigation";

// CLIENT PORTAL IS DISABLED
// This route returns 403 Forbidden - client portal is not available
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// CLIENT PORTAL IS DISABLED
// All client portal functionality is not available
export default async function ClientDashboardPage() {
  // Redirect to main dashboard - client portal is disabled
  redirect("/dashboard");
}

