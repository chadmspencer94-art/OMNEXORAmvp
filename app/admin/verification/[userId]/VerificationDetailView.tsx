"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import type { UserVerification } from "@prisma/client";

interface VerificationDetailViewProps {
  verification: UserVerification;
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  adminUserId: string;
}

export default function VerificationDetailView({
  verification,
  user,
  adminUserId,
}: VerificationDetailViewProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminNotes, setAdminNotes] = useState(verification.adminNotes || "");
  const [rejectionReason, setRejectionReason] = useState(verification.rejectionReason || "");

  const handleStatusChange = async (status: "verified" | "pending" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/verification/${user.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes || null,
          rejectionReason: status === "rejected" ? rejectionReason : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setSuccess(`Verification ${status}`);
      // Refresh page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/admin/verification"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Verification List
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Review</h1>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{user.email}</span>
          <span>•</span>
          <span>{user.role}</span>
          <span>•</span>
          <Link href={`/admin/users/${user.id}`} className="text-amber-600 hover:text-amber-700">
            View User →
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        {verification.status === "verified" && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
            <CheckCircle className="w-5 h-5" />
            Verified
          </span>
        )}
        {verification.status === "pending" && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium">
            <Clock className="w-5 h-5" />
            Pending Review
          </span>
        )}
        {verification.status === "rejected" && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
            <XCircle className="w-5 h-5" />
            Rejected
          </span>
        )}
        {verification.status === "unverified" && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
            Unverified
          </span>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Verification Details */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        {/* Business Details */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Business Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Business Name</p>
              <p className="text-slate-900">{verification.businessName || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">ABN</p>
              <p className="text-slate-900 font-mono">{verification.abn || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Primary Trade</p>
              <p className="text-slate-900">{verification.primaryTrade || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Work Types</p>
              <p className="text-slate-900">{verification.workTypes || "-"}</p>
            </div>
          </div>
          {verification.abnEvidenceUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500 mb-1">ABN Evidence</p>
              <a
                href={verification.abnEvidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 underline"
              >
                {verification.abnEvidenceUrl}
              </a>
            </div>
          )}
        </div>

        {/* Licence Details */}
        {(verification.licenceNumber || verification.licenceType || verification.licenceExpiry) && (
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Licence Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verification.licenceType && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Licence Type</p>
                  <p className="text-slate-900">{verification.licenceType}</p>
                </div>
              )}
              {verification.licenceNumber && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Licence Number</p>
                  <p className="text-slate-900 font-mono">{verification.licenceNumber}</p>
                </div>
              )}
              {verification.licenceExpiry && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Expiry Date</p>
                  <p className="text-slate-900">{formatDate(verification.licenceExpiry)}</p>
                </div>
              )}
            </div>
            {verification.licenceEvidenceUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500 mb-1">Licence Evidence</p>
                <a
                  href={verification.licenceEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  {verification.licenceEvidenceUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Insurance Details */}
        {(verification.insuranceProvider ||
          verification.insurancePolicyNumber ||
          verification.insuranceExpiry) && (
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Insurance Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verification.insuranceProvider && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Provider</p>
                  <p className="text-slate-900">{verification.insuranceProvider}</p>
                </div>
              )}
              {verification.insurancePolicyNumber && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Policy Number</p>
                  <p className="text-slate-900 font-mono">{verification.insurancePolicyNumber}</p>
                </div>
              )}
              {verification.insuranceExpiry && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Expiry Date</p>
                  <p className="text-slate-900">{formatDate(verification.insuranceExpiry)}</p>
                </div>
              )}
              {verification.insuranceCoverageNotes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-slate-500 mb-1">Coverage Notes</p>
                  <p className="text-slate-900">{verification.insuranceCoverageNotes}</p>
                </div>
              )}
            </div>
            {verification.insuranceEvidenceUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500 mb-1">Insurance Evidence</p>
                <a
                  href={verification.insuranceEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  {verification.insuranceEvidenceUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Admin Controls */}
        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="adminNotes" className="block text-sm font-medium text-slate-700 mb-2">
                Admin Notes (Internal Only)
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                placeholder="Internal notes for admin reference..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason (Visible to User)
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                placeholder="Reason for rejection (shown to user)..."
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={() => handleStatusChange("verified")}
                disabled={isLoading || verification.status === "verified"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Mark as Verified
              </button>

              <button
                onClick={() => handleStatusChange("pending")}
                disabled={isLoading || verification.status === "pending"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                Mark as Pending
              </button>

              <button
                onClick={() => handleStatusChange("rejected")}
                disabled={isLoading || verification.status === "rejected" || !rejectionReason.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject Verification
              </button>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-6 border-t border-slate-200 text-sm text-slate-500">
          <p>Created: {formatDate(verification.createdAt)}</p>
          <p>Last Updated: {formatDate(verification.updatedAt)}</p>
          {verification.reviewedByAdminId && (
            <p>Reviewed by: {verification.reviewedByAdminId}</p>
          )}
        </div>
      </div>
    </div>
  );
}

