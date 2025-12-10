import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import MaterialsLibraryClient from "./MaterialsLibraryClient";

// Authenticated page using requireActiveUser - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MaterialsLibraryPage() {
  const user = await requireActiveUser("/settings/materials");

  // Redirect clients
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  return <MaterialsLibraryClient />;
}

