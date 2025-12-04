"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BusinessFormData {
  businessName: string;
  tradingName: string;
  abn: string;
  tradeTypes: string;
  serviceArea: string;
  insuranceProvider: string;
  insuranceExpiry: string;
  licenceNumber: string;
}

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

interface UserData {
  email: string;
  role: string;
  verificationStatus: string;
  businessDetails?: BusinessDetails;
}

function BusinessDetailsSummary({ details }: { details: BusinessDetails }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Business Name</p>
          <p className="text-slate-900">{details.businessName || "-"}</p>
        </div>
        {details.tradingName && (
          <div>
            <p className="text-sm font-medium text-slate-500">Trading Name</p>
            <p className="text-slate-900">{details.tradingName}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-500">ABN</p>
          <p className="text-slate-900">{details.abn || "-"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Trade Types</p>
          <p className="text-slate-900">{details.tradeTypes?.join(", ") || "-"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Service Area</p>
          <p className="text-slate-900">{details.serviceArea || "-"}</p>
        </div>
        {details.insuranceProvider && (
          <div>
            <p className="text-sm font-medium text-slate-500">Insurance Provider</p>
            <p className="text-slate-900">{details.insuranceProvider}</p>
          </div>
        )}
        {details.insuranceExpiry && (
          <div>
            <p className="text-sm font-medium text-slate-500">Insurance Expiry</p>
            <p className="text-slate-900">{details.insuranceExpiry}</p>
          </div>
        )}
        {details.licenceNumber && (
          <div>
            <p className="text-sm font-medium text-slate-500">Licence Number</p>
            <p className="text-slate-900">{details.licenceNumber}</p>
          </div>
        )}
      </div>
      {details.verificationSubmittedAt && (
        <p className="text-xs text-slate-500 mt-4">
          Submitted: {new Date(details.verificationSubmittedAt).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

export default function VerificationPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: "",
    tradingName: "",
    abn: "",
    tradeTypes: "",
    serviceArea: "",
    insuranceProvider: "",
    insuranceExpiry: "",
    licenceNumber: "",
  });

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          
          // Pre-fill form if business details exist
          if (data.user.businessDetails) {
            const bd = data.user.businessDetails;
            setFormData({
              businessName: bd.businessName || "",
              tradingName: bd.tradingName || "",
              abn: bd.abn || "",
              tradeTypes: bd.tradeTypes?.join(", ") || "",
              serviceArea: bd.serviceArea || "",
              insuranceProvider: bd.insuranceProvider || "",
              insuranceExpiry: bd.insuranceExpiry || "",
              licenceNumber: bd.licenceNumber || "",
            });
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/settings/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit verification");
        setIsSubmitting(false);
        return;
      }

      // Redirect to dashboard with success
      router.push("/dashboard?verification=submitted");
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

  // Only tradies can access this page
  if (userData?.role !== "tradie") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Not Required</h1>
          <p className="text-slate-600 mb-6">
            Business verification is only required for trade accounts.
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

  // If already verified, show success with details
  if (userData?.verificationStatus === "verified") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center border-b border-slate-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Your Business is Verified!</h1>
            <p className="text-slate-600">
              Your business has been verified. No further action is required.
            </p>
          </div>
          
          {userData.businessDetails && (
            <div className="p-6 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Your Business Details</h2>
              <BusinessDetailsSummary details={userData.businessDetails} />
            </div>
          )}
          
          <div className="p-6 border-t border-slate-100">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If pending review, show info with submitted details
  if (userData?.verificationStatus === "pending_review") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center border-b border-slate-100">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Verification Under Review</h1>
            <p className="text-slate-600">
              Your verification is under review. You will be notified when it is approved or rejected.
            </p>
          </div>
          
          {userData.businessDetails && (
            <div className="p-6 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Submitted Details</h2>
              <BusinessDetailsSummary details={userData.businessDetails} />
            </div>
          )}
          
          <div className="p-6 border-t border-slate-100">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show form for unverified or rejected users
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Business Verification</h1>
        <p className="text-slate-600">
          Verify your business to unlock full platform features and display your &quot;Verified Trade&quot; badge.
        </p>
      </div>

      {userData?.verificationStatus === "rejected" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Previous verification was rejected</p>
              <p className="text-sm text-red-700 mt-1">
                Please update your details and resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Business Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Business Details</h2>
          
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-2">
              Business Name <span className="text-red-500">*</span>
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
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="tradingName" className="block text-sm font-medium text-slate-700 mb-2">
              Trading Name (optional)
            </label>
            <input
              type="text"
              id="tradingName"
              name="tradingName"
              value={formData.tradingName}
              onChange={handleChange}
              placeholder="e.g. Perth Pro Painters"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="tradeTypes" className="block text-sm font-medium text-slate-700 mb-2">
              Trade Types <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tradeTypes"
              name="tradeTypes"
              value={formData.tradeTypes}
              onChange={handleChange}
              placeholder="e.g. Painter, Plasterer (comma separated)"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              required
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500">Separate multiple trades with commas</p>
          </div>

          <div>
            <label htmlFor="serviceArea" className="block text-sm font-medium text-slate-700 mb-2">
              Service Area <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="serviceArea"
              name="serviceArea"
              value={formData.serviceArea}
              onChange={handleChange}
              placeholder="e.g. Perth Metro, Mandurah, Rockingham"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Insurance & Licence */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Insurance & Licence</h2>
          
          <div>
            <label htmlFor="insuranceProvider" className="block text-sm font-medium text-slate-700 mb-2">
              Insurance Provider (optional)
            </label>
            <input
              type="text"
              id="insuranceProvider"
              name="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={handleChange}
              placeholder="e.g. QBE, Allianz"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="insuranceExpiry" className="block text-sm font-medium text-slate-700 mb-2">
              Insurance Expiry Date (optional)
            </label>
            <input
              type="text"
              id="insuranceExpiry"
              name="insuranceExpiry"
              value={formData.insuranceExpiry}
              onChange={handleChange}
              placeholder="e.g. 15/03/2025"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="licenceNumber" className="block text-sm font-medium text-slate-700 mb-2">
              Trade Licence Number (optional)
            </label>
            <input
              type="text"
              id="licenceNumber"
              name="licenceNumber"
              value={formData.licenceNumber}
              onChange={handleChange}
              placeholder="e.g. WA12345"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Prototype Note */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Prototype Note:</span> In the full launch, you&apos;ll also upload your ABN and insurance documents here.
            For now in the prototype, we&apos;re storing your details and manually verifying.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit for Verification"}
          </button>
          <p className="mt-3 text-xs text-slate-500 text-center">
            By submitting, you confirm that all information provided is accurate and up to date.
          </p>
        </div>
      </form>
    </div>
  );
}
