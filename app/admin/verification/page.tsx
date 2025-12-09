"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface Verification {
  id: string;
  userId: string;
  status: string;
  businessName: string | null;
  abn: string | null;
  primaryTrade: string | null;
  workTypes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function AdminVerificationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [error, setError] = useState("");

  const fetchVerifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/verification");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setVerifications(data.verifications || []);
      } else if (response.status === 403) {
        setIsAdmin(false);
      } else {
        router.push("/login");
      }
    } catch {
      setError("Failed to load verifications");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            Unverified
          </span>
        );
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

  const pendingVerifications = verifications.filter((v) => v.status === "pending");
  const verifiedVerifications = verifications.filter((v) => v.status === "verified");
  const rejectedVerifications = verifications.filter((v) => v.status === "rejected");

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-900">{pendingVerifications.length}</div>
          <div className="text-sm text-amber-700">Pending Review</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{verifiedVerifications.length}</div>
          <div className="text-sm text-green-700">Verified</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-900">{rejectedVerifications.length}</div>
          <div className="text-sm text-red-700">Rejected</div>
        </div>
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

      {verifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No Verifications</h2>
          <p className="text-slate-600">
            No verification records found.
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
                    Primary Trade
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
                {verifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-900">{verification.user.email}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(verification.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-900">
                        {verification.businessName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-mono text-slate-900">
                        {verification.abn || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-900">
                        {verification.primaryTrade || "-"}
                      </div>
                      {verification.workTypes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {verification.workTypes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(verification.status)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/verification/${verification.userId}`}
                        className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Review
                      </Link>
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
