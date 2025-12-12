import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import { getPriceLists, createPriceList, deletePriceList, type PriceListType } from "./actions";
import PriceListsClient from "./PriceListsClient";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  // Demo bypass for development mode
  const isDemoMode = process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true";
  
  let user;
  if (isDemoMode) {
    // In demo mode, allow access without authentication
    user = null;
  } else {
    user = await requireActiveUser("/admin/pricing");
    if (!isAdmin(user)) {
      redirect("/dashboard");
    }
  }

  const lists = await getPriceLists();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Navigation */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Users
        </Link>
        <Link
          href="/admin/verification"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Verifications
        </Link>
        <Link
          href="/admin/feedback"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Feedback Log
        </Link>
        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg">
          Pricing Lists
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Price Lists</h1>
        <p className="mt-2 text-slate-600">
          Manage Trade and Shelf price lists with manual entry and CSV import.
        </p>
      </div>

      <PriceListsClient initialLists={lists} />
    </div>
  );
}

