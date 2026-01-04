"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isClient } from "@/lib/auth";

interface VerificationData {
  status: string;
  businessName: string | null;
  abn: string | null;
  primaryTrade: string | null;
  workTypes: string | null;
  licenceNumber: string | null;
  licenceType: string | null;
  licenceExpiry: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiry: string | null;
  insuranceCoverageNotes: string | null;
  abnEvidenceUrl: string | null;
  licenceEvidenceUrl: string | null;
  insuranceEvidenceUrl: string | null;
  rejectionReason: string | null;
}

interface UserData {
  email: string;
  role: string;
}

export default function VerificationPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    abn: "",
    primaryTrade: "",
    workTypes: "",
    licenceNumber: "",
    licenceType: "",
    licenceExpiry: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
    insuranceCoverageNotes: "",
    abnEvidenceUrl: "",
    licenceEvidenceUrl: "",
    insuranceEvidenceUrl: "",
  });

  // Fetch user and verification data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const userResponse = await fetch("/api/auth/me");
        if (!userResponse.ok) {
          router.push("/login");
          return;
        }
        const userData = await userResponse.json();
        setUserData(userData.user);

        // Clients don't need verification
        if (userData.user.role === "client") {
          setIsLoading(false);
          return;
        }

        // Fetch verification record
        const verificationResponse = await fetch("/api/settings/verification");
        if (verificationResponse.ok) {
          const data = await verificationResponse.json();
          setVerification(data.verification);

          // Pre-fill form
          if (data.verification) {
            setFormData({
              businessName: data.verification.businessName || "",
              abn: data.verification.abn || "",
              primaryTrade: data.verification.primaryTrade || "",
              workTypes: data.verification.workTypes || "",
              licenceNumber: data.verification.licenceNumber || "",
              licenceType: data.verification.licenceType || "",
              licenceExpiry: data.verification.licenceExpiry ? new Date(data.verification.licenceExpiry).toISOString().split("T")[0] : "",
              insuranceProvider: data.verification.insuranceProvider || "",
              insurancePolicyNumber: data.verification.insurancePolicyNumber || "",
              insuranceExpiry: data.verification.insuranceExpiry ? new Date(data.verification.insuranceExpiry).toISOString().split("T")[0] : "",
              insuranceCoverageNotes: data.verification.insuranceCoverageNotes || "",
              abnEvidenceUrl: data.verification.abnEvidenceUrl || "",
              licenceEvidenceUrl: data.verification.licenceEvidenceUrl || "",
              insuranceEvidenceUrl: data.verification.insuranceEvidenceUrl || "",
            });
          }
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === "checkbox") {
      // Handle work types checkboxes
      const currentTypes = formData.workTypes.split(",").filter((t) => t.trim());
      if (checked) {
        if (!currentTypes.includes(name)) {
          setFormData((prev) => ({
            ...prev,
            workTypes: [...currentTypes, name].join(","),
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          workTypes: currentTypes.filter((t) => t !== name).join(","),
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/settings/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          licenceExpiry: formData.licenceExpiry || null,
          insuranceExpiry: formData.insuranceExpiry || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit verification");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      // Reload verification status
      const verificationResponse = await fetch("/api/settings/verification");
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        setVerification(verificationData.verification);
      }
      setIsSubmitting(false);
    } catch {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // Clients don't need verification
  if (userData?.role === "client") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Not Required</h1>
          <p className="text-slate-600 mb-6">
            Business verification is only required for trade/business accounts.
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

  const status = verification?.status || "unverified";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-3 border-b border-slate-200">
        <Link
          href="/settings"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Pricing
        </Link>
        <Link
          href="/settings/business-profile"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Business Profile
        </Link>
        <Link
          href="/settings/verification"
          className="px-4 py-2 text-sm font-medium text-amber-600 border-b-2 border-amber-500"
        >
          Verification
        </Link>
      </div>

      {/* Status Banner */}
      {status === "verified" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Your account is structured.</p>
            </div>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-amber-900">Your verification is being reviewed.</p>
              <p className="text-sm text-amber-700 mt-1">We&apos;ll notify you once the review is complete.</p>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-900">Your verification was not approved.</p>
              {verification?.rejectionReason && (
                <p className="text-sm text-red-700 mt-1">Reason: {verification.rejectionReason}</p>
              )}
              <p className="text-sm text-red-700 mt-1">Please update your details and resubmit.</p>
            </div>
          </div>
        </div>
      )}

      {status === "unverified" && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-slate-900">You&apos;re not structured yet.</p>
              <p className="text-sm text-slate-700 mt-1">Structured profiles help clients trust you.</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Verification details submitted. We&apos;ll review them soon.</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Business Details Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Business Details</h2>
          
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-2">
              Business / Trading Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g. Perth Pro Painters Pty Ltd"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              required
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="abn" className="block text-sm font-medium text-slate-700 mb-2">
              ABN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="abn"
              name="abn"
              value={formData.abn}
              onChange={handleChange}
              placeholder="e.g. 12 345 678 901"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              required
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="primaryTrade" className="block text-sm font-medium text-slate-700 mb-2">
              Primary Trade <span className="text-red-500">*</span>
            </label>
            <select
              id="primaryTrade"
              name="primaryTrade"
              value={formData.primaryTrade}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              required
              disabled={isSubmitting || status === "pending" || status === "verified"}
            >
              <option value="">Select a trade...</option>
              <option value="Painter">Painter</option>
              <option value="Plasterer">Plasterer</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Electrician">Electrician</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Work Types <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="residential"
                  checked={formData.workTypes.includes("residential")}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                  disabled={isSubmitting || status === "pending" || status === "verified"}
                />
                <span className="text-sm text-slate-700">Residential</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="commercial"
                  checked={formData.workTypes.includes("commercial")}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                  disabled={isSubmitting || status === "pending" || status === "verified"}
                />
                <span className="text-sm text-slate-700">Commercial</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="strata"
                  checked={formData.workTypes.includes("strata")}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                  disabled={isSubmitting || status === "pending" || status === "verified"}
                />
                <span className="text-sm text-slate-700">Strata</span>
              </label>
            </div>
          </div>
        </div>

        {/* Licence Details Section */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Licence Details</h2>
          
          <div>
            <label htmlFor="licenceType" className="block text-sm font-medium text-slate-700 mb-2">
              Licence Type
            </label>
            <input
              type="text"
              id="licenceType"
              name="licenceType"
              value={formData.licenceType}
              onChange={handleChange}
              placeholder="e.g. Painter's licence, Builder's licence"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="licenceNumber" className="block text-sm font-medium text-slate-700 mb-2">
              Licence Number
            </label>
            <input
              type="text"
              id="licenceNumber"
              name="licenceNumber"
              value={formData.licenceNumber}
              onChange={handleChange}
              placeholder="e.g. WA12345"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="licenceExpiry" className="block text-sm font-medium text-slate-700 mb-2">
              Licence Expiry Date
            </label>
            <input
              type="date"
              id="licenceExpiry"
              name="licenceExpiry"
              value={formData.licenceExpiry}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="licenceEvidenceUrl" className="block text-sm font-medium text-slate-700 mb-2">
              Licence Evidence URL
            </label>
            <input
              type="url"
              id="licenceEvidenceUrl"
              name="licenceEvidenceUrl"
              value={formData.licenceEvidenceUrl}
              onChange={handleChange}
              placeholder="Link to licence file / ASIC search / image"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
            <p className="mt-1 text-xs text-slate-500">Paste a link to your licence document or verification page</p>
          </div>
        </div>

        {/* Insurance Details Section */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Insurance Details</h2>
          
          <div>
            <label htmlFor="insuranceProvider" className="block text-sm font-medium text-slate-700 mb-2">
              Insurance Provider
            </label>
            <input
              type="text"
              id="insuranceProvider"
              name="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={handleChange}
              placeholder="e.g. QBE, Allianz"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-slate-700 mb-2">
              Policy Number
            </label>
            <input
              type="text"
              id="insurancePolicyNumber"
              name="insurancePolicyNumber"
              value={formData.insurancePolicyNumber}
              onChange={handleChange}
              placeholder="e.g. PL-123456"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="insuranceExpiry" className="block text-sm font-medium text-slate-700 mb-2">
              Insurance Expiry Date
            </label>
            <input
              type="date"
              id="insuranceExpiry"
              name="insuranceExpiry"
              value={formData.insuranceExpiry}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="insuranceCoverageNotes" className="block text-sm font-medium text-slate-700 mb-2">
              Coverage Notes
            </label>
            <textarea
              id="insuranceCoverageNotes"
              name="insuranceCoverageNotes"
              value={formData.insuranceCoverageNotes}
              onChange={handleChange}
              placeholder="e.g. Public liability up to $20M"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
          </div>

          <div>
            <label htmlFor="insuranceEvidenceUrl" className="block text-sm font-medium text-slate-700 mb-2">
              Insurance Evidence URL
            </label>
            <input
              type="url"
              id="insuranceEvidenceUrl"
              name="insuranceEvidenceUrl"
              value={formData.insuranceEvidenceUrl}
              onChange={handleChange}
              placeholder="Link to insurance certificate / document"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
            <p className="mt-1 text-xs text-slate-500">Paste a link to your insurance certificate or document</p>
          </div>
        </div>

        {/* ABN Evidence Section */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">ABN Evidence</h2>
          
          <div>
            <label htmlFor="abnEvidenceUrl" className="block text-sm font-medium text-slate-700 mb-2">
              ABN Evidence URL
            </label>
            <input
              type="url"
              id="abnEvidenceUrl"
              name="abnEvidenceUrl"
              value={formData.abnEvidenceUrl}
              onChange={handleChange}
              placeholder="Link to ABN lookup / ASIC / document in Drive"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting || status === "pending" || status === "verified"}
            />
            <p className="mt-1 text-xs text-slate-500">Paste a link to ABN lookup result, ASIC record, or uploaded document</p>
          </div>
        </div>

        {/* Submit Button */}
        {(status === "unverified" || status === "rejected") && (
          <div className="pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Save & Submit for Review"}
            </button>
            <p className="mt-3 text-xs text-slate-500 text-center">
              By submitting, you confirm that all information provided is accurate and up to date.
            </p>
          </div>
        )}

        {(status === "pending" || status === "verified") && (
          <div className="pt-6 border-t border-slate-200">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

