import { redirect } from "next/navigation";

// CLIENT PORTAL IS DISABLED
// This route redirects to main dashboard - client portal is not available
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ClientJobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientJobDetailPage({ params }: ClientJobDetailPageProps) {
  // Client portal is disabled - redirect to main dashboard
  redirect("/dashboard");
}
