"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ClientSignatureDisplayProps {
  jobId: string;
  clientSignatureId?: string | null;
  clientSignedName?: string | null;
  clientSignedEmail?: string | null;
  clientAcceptedAt?: string | null;
}

export default function ClientSignatureDisplay({
  jobId,
  clientSignatureId,
  clientSignedName,
  clientSignedEmail,
  clientAcceptedAt,
}: ClientSignatureDisplayProps) {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadSignature() {
      if (!clientSignatureId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/jobs/${jobId}/signature/${clientSignatureId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imageDataUrl) {
            setSignatureImage(data.imageDataUrl);
          }
        }
      } catch (error) {
        console.error("Failed to load signature image:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSignature();
  }, [jobId, clientSignatureId]);

  if (!clientSignatureId && !clientSignedName) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Signature</h3>
      {clientAcceptedAt ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          ) : (
            <>
              {signatureImage && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <img
                    src={signatureImage}
                    alt="Client signature"
                    className="max-w-full h-auto max-h-32 mx-auto"
                  />
                </div>
              )}
              <div className="space-y-2 text-sm">
                {clientSignedName && (
                  <div>
                    <span className="text-slate-500">Signed by:</span>{" "}
                    <span className="font-medium text-slate-900">{clientSignedName}</span>
                  </div>
                )}
                {clientSignedEmail && (
                  <div>
                    <span className="text-slate-500">Email:</span>{" "}
                    <span className="font-medium text-slate-900">{clientSignedEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Date:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {new Date(clientAcceptedAt).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No digital signature on record</p>
      )}
    </div>
  );
}

