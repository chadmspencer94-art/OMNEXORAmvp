"use client";

import { useState } from "react";
import { calculateEstimateRange } from "@/lib/pricing";

type VerificationStatus = "unverified" | "pending" | "verified" | "pending_review" | "rejected";

interface TotalEstimateQuote {
  description?: string;
  totalJobEstimate?: string;
}

interface ParsedQuote {
  totalEstimate?: TotalEstimateQuote;
}

interface EmailToClientButtonProps {
  title: string;
  clientEmail?: string;
  clientName?: string;
  address?: string;
  summary?: string;
  scopeOfWork?: string;
  inclusions?: string;
  exclusions?: string;
  quoteJson?: string;
  verificationStatus?: VerificationStatus;
  planTier?: string;
}

export default function EmailToClientButton({
  title,
  clientEmail,
  clientName,
  address,
  summary,
  scopeOfWork,
  inclusions,
  exclusions,
  quoteJson,
  verificationStatus,
  planTier = "FREE",
}: EmailToClientButtonProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleEmail = () => {
    // PLAN CHECK: Free users cannot email job packs to clients
    const hasPaidPlan = planTier !== "FREE";
    if (!hasPaidPlan) {
      setAlertMessage("A paid membership is required to email job packs to clients. Please upgrade your plan to continue.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 8000);
      return;
    }
    
    // VERIFICATION GUARD: Only verified businesses can email job packs to clients.
    // This is a soft guard for the prototype phase. For public launch, this guard
    // can be toggled or extended once full verification flows are implemented.
    // Note: Copy-to-clipboard and internal use of job packs still work for unverified users.
    const isVerified = verificationStatus === "verified";
    if (!isVerified) {
      setAlertMessage("Only verified businesses can email job packs to clients. (Prototype rule)");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    // Check if client email is set
    if (!clientEmail) {
      setAlertMessage("Client email not set for this job.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Calculate realistic estimate range
    const estimateRange = calculateEstimateRange(quoteJson);
    const priceRange = estimateRange.formattedRange !== "N/A" ? estimateRange.formattedRange : "";

    // Build scope of work as numbered list
    const scopeLines = scopeOfWork?.split("\n").filter((line) => line.trim()) || [];
    const numberedScope = scopeLines
      .map((line, i) => `${i + 1}. ${line}`)
      .join("\n");

    // Build inclusions as bullet list
    const inclusionLines = inclusions?.split("\n").filter((line) => line.trim()) || [];
    const bulletInclusions = inclusionLines.map((line) => `- ${line}`).join("\n");

    // Build exclusions as bullet list
    const exclusionLines = exclusions?.split("\n").filter((line) => line.trim()) || [];
    const bulletExclusions = exclusionLines.map((line) => `- ${line}`).join("\n");

    // Build the email body
    const sections: string[] = [];

    // Greeting
    if (clientName) {
      sections.push(`Hi ${clientName},`);
    } else {
      sections.push("Hi,");
    }
    sections.push("");
    sections.push("Please find below your painting quote for the following job:");
    sections.push("");

    sections.push(`JOB: ${title}`);
    
    if (address) {
      sections.push(`ADDRESS: ${address}`);
    }

    sections.push("");

    if (summary) {
      sections.push("SUMMARY");
      sections.push(summary);
      sections.push("");
    }

    if (numberedScope) {
      sections.push("SCOPE OF WORK");
      sections.push(numberedScope);
      sections.push("");
    }

    if (bulletInclusions) {
      sections.push("WHAT'S INCLUDED");
      sections.push(bulletInclusions);
      sections.push("");
    }

    if (bulletExclusions) {
      sections.push("NOT INCLUDED");
      sections.push(bulletExclusions);
      sections.push("");
    }

    if (priceRange) {
      sections.push("ESTIMATED PRICE");
      sections.push(priceRange);
      sections.push("");
    }

    sections.push("---");
    sections.push("");
    sections.push("Please let me know if you have any questions or would like to proceed.");
    sections.push("");
    sections.push("Kind regards");

    const body = sections.join("\n");
    const subject = `Painting quote - ${title}`;

    // Build mailto URL
    const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoUrl;
  };

  // Show a subtle visual difference for unverified or free plan users (but still clickable to show the message)
  const hasPaidPlan = planTier !== "FREE";
  const canEmail = verificationStatus === "verified" && hasPaidPlan;

  return (
    <div className="relative">
      <button
        onClick={handleEmail}
        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          canEmail
            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        title={canEmail ? "Email job pack to client" : (!hasPaidPlan ? "Paid plan required" : "Verification required to email clients")}
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email to Client
        {!canEmail && (
          <svg className="w-3 h-3 ml-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      {/* Alert popup */}
      {showAlert && (
        <div className="absolute right-0 top-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{alertMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

