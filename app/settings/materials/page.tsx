import { redirect } from "next/navigation";
import { requireActiveUser, isClient } from "@/lib/auth";
import MaterialsLibraryClient from "./MaterialsLibraryClient";

export default async function MaterialsLibraryPage() {
  const user = await requireActiveUser("/settings/materials");

  // Redirect clients
  if (isClient(user)) {
    redirect("/client/dashboard");
  }

  return <MaterialsLibraryClient />;
}

