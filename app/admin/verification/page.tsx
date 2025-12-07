"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BusinessDetails {
  businessName?: string;
  tradingName?: string;
  abn?: string;
  tradeTypes?: string[];
  serviceArea?: string;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  licenceNumber?: string;
  verificationSubmittedAt?: string;
}

interface PendingUser {
  id: string;
  email: string;
  createdAt: string;
  role: string;
  verificationStatus: string;
  businessDetails?: BusinessDetails;
}

export default function AdminVerificationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/verification");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setPendingUsers(data.users || []);
      } else if (response.status === 403) {
        setIsAdmin(false);
      } else {
        router.push("/login");
      }
    } catch {
      setError("Failed to load pending verifications");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
      });

      if (response.ok) {
        // Refresh the list - await to ensure loading state is accurate
        await fetchPendingUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to approve");
      }
    } catch {
      setError("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectionReason[userId];
    if (!reason?.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reject", reason }),
      });

      if (response.ok) {
        // Refresh the list - await to ensure loading state is accurate
        await fetchPendingUsers();
        setRejectionReason((prev) => ({ ...prev, [userId]: "" }));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reject");
      }
    } catch {
      setError("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Admin Navigation */}
      <div className="mb-6 flex gap-3">
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Users
        </Link>
        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg">
          Verifications
        </span>
        <Link
          href="/admin/feedback"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Feedback Log
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Reviews</h1>
        <p className="text-slate-600">
          Review and approve tradie business verifications.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">All Caught Up!</h2>
          <p className="text-slate-600">
            No pending verifications to review.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ABN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Service Area
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-900">{user.email}</div>
                      <div className="text-xs text-slate-500">
                        {user.businessDetails?.verificationSubmittedAt
                          ? `Submitted ${new Date(user.businessDetails.verificationSubmittedAt).toLocaleDateString()}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-900">
                        {user.businessDetails?.businessName || "-"}
                      </div>
                      {user.businessDetails?.tradingName && (
                        <div className="text-xs text-slate-500">
                          Trading as: {user.businessDetails.tradingName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-mono text-slate-900">
                        {user.businessDetails?.abn || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-900">
                        {user.businessDetails?.tradeTypes?.join(", ") || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-900">
                        {user.businessDetails?.serviceArea || "-"}
                      </div>
                      {/* Show insurance/licence info if available */}
                      {(user.businessDetails?.insuranceProvider || user.businessDetails?.licenceNumber) && (
                        <div className="text-xs text-slate-500 mt-1">
                          {user.businessDetails?.insuranceProvider && (
                            <span>Insurance: {user.businessDetails.insuranceProvider}</span>
                          )}
                          {user.businessDetails?.insuranceExpiry && (
                            <span className="ml-1">(exp: {user.businessDetails.insuranceExpiry})</span>
                          )}
                          {user.businessDetails?.licenceNumber && (
                            <span className="ml-2">Licence: {user.businessDetails.licenceNumber}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? "..." : "✓ Approve"}
                        </button>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={rejectionReason[user.id] || ""}
                            onChange={(e) =>
                              setRejectionReason((prev) => ({
                                ...prev,
                                [user.id]: e.target.value,
                              }))
                            }
                            placeholder="Reason..."
                            className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs w-24"
                            disabled={actionLoading === user.id}
                          />
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
