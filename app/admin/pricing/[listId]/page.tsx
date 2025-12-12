import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import { getPriceListById } from "../actions";
import PriceListDetailClient from "./PriceListDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminPricingListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  // Demo bypass for development mode
  const isDemoMode = process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true";
  
  if (!isDemoMode) {
    const user = await requireActiveUser("/admin/pricing");
    if (!isAdmin(user)) {
      redirect("/dashboard");
    }
  }

  const { listId } = await params;
  const list = await getPriceListById(listId);

  if (!list) {
    redirect("/admin/pricing");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PriceListDetailClient initialList={list} />
    </div>
  );
}

