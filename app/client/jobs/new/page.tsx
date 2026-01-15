import { redirect } from "next/navigation";

// CLIENT PORTAL IS DISABLED
// This route redirects to main dashboard - client portal is not available
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewClientJobPage() {
  // Client portal is disabled - redirect to main dashboard
  redirect("/dashboard");
}
