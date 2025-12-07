"use client";

import { useState, useEffect } from "react";
import { Check, Clock } from "lucide-react";
import type { JobDocumentType } from "@/lib/jobDocumentSignatures";

interface ClientSignatureStatusProps {
  jobId: string;
  docType: JobDocumentType;
  docKey?: string | null;
  label: string;
}

interface SignatureInfo {
  signedName: string;
  signedAt: string;
  docType: string;
}

export default function ClientSignatureStatus({
  jobId,
  docType,
  docKey,
  label,
}: ClientSignatureStatusProps) {
  const [signature, setSignature] = useState<SignatureInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSignature() {
      try {
        const url = `/api/jobs/${jobId}/sign-document?docType=${docType}${docKey ? `&docKey=${encodeURIComponent(docKey)}` : ""}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.signature) {
            setSignature({
              signedName: data.signature.signedName,
              signedAt: data.signature.signedAt,
              docType: data.signature.docType,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load signature status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSignature();
  }, [jobId, docType, docKey]);

  if (isLoading) {
    return null;
  }

  if (!signature) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock className="w-4 h-4 text-amber-500" />
        <span>Client signature: Pending</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className="w-4 h-4 text-green-600" />
      <div>
        <span className="font-medium text-green-700">Client has accepted and signed this {label.toLowerCase()}</span>
        <div className="text-xs text-slate-600 mt-0.5">
          Signed by: {signature.signedName} on{" "}
          {new Date(signature.signedAt).toLocaleString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

