import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import RateTemplatesClient from "./RateTemplatesClient";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RateTemplatesPage() {
  const user = await requireActiveUser("/settings/rates");

  // Redirect clients
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  return <RateTemplatesClient />;
}

