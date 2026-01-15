import { redirect } from "next/navigation";

/**
 * CLIENT PORTAL IS DISABLED
 * 
 * This route redirects to main dashboard as client portal is not available.
 * 
 * PLANNED: Visual update scheduled for future release when portal is re-enabled
 * - Modernize appearance with contemporary design
 * - Improve mobile responsiveness
 * - Make interface more user-friendly
 * - Maintain existing functionality
 * 
 * See: Master Implementation Prompt - Client Portal Appearance item
 * 
 * Note: Do not modify functionality - only visual updates when re-enabled.
 */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function ClientDashboardPage() {
  // Redirect to main dashboard - client portal is disabled
  redirect("/dashboard");
}

