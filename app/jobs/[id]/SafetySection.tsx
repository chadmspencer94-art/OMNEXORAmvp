"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Edit2, Download, Shield, AlertTriangle, Users, RefreshCw } from "lucide-react";
import SafetyDocumentEditor from "./SafetyDocumentEditor";
import SafetyDocumentPdfButton from "./SafetyDocumentPdfButton";
import AIWarningBanner from "@/app/components/AIWarningBanner";
import OvisBadge from "@/app/components/OvisBadge";

// User-friendly error message for safety document operations
const FRIENDLY_ERROR_MESSAGE = "Safety documents aren't available right now. Please try again shortly.";

interface SafetySectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  businessName?: string;
}

type SafetyDocumentType = "SWMS" | "RISK_ASSESSMENT" | "TOOLBOX_TALK";

interface SafetyDocument {
  id: string;
  jobId: string;
  type: SafetyDocumentType;
  title: string;
  content: string;
  status: "draft" | "generated" | "reviewed";
  createdAt: string;
  updatedAt: string;
}

interface DocumentConfig {
  type: SafetyDocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  {
    type: "SWMS",
    label: "SWMS",
    description: "Safe Work Method Statement",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    type: "RISK_ASSESSMENT",
    label: "Risk Assessment",
    description: "Hazard identification and risk controls",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    type: "TOOLBOX_TALK",
    label: "Toolbox Talk",
    description: "Safety briefing outline",
    icon: <Users className="w-5 h-5" />,
  },
];

export default function SafetySection({
  jobId,
  jobTitle,
  tradeType,
  address,
  businessName,
}: SafetySectionProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<SafetyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<SafetyDocumentType | null>(null);
  const [editingDoc, setEditingDoc] = useState<SafetyDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [jobId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}/safety`);
      if (!response.ok) {
        // Try to get error from response, but don't expose raw errors
        try {
          const data = await response.json();
          // Only use the error if it's a known friendly message
          if (data.error && !data.error.includes("prisma") && !data.error.includes("DATABASE")) {
            throw new Error(data.error);
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(FRIENDLY_ERROR_MESSAGE);
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching safety documents:", err);
      // Always show friendly message to user
      setError(FRIENDLY_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type: SafetyDocumentType) => {
    setGenerating(type);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/safety`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        let errorMessage = FRIENDLY_ERROR_MESSAGE;
        try {
          const data = await response.json();
          // Only use API error if it looks safe (no internal details)
          if (data.error && 
              !data.error.toLowerCase().includes("prisma") && 
              !data.error.toLowerCase().includes("database") &&
              !data.error.toLowerCase().includes("schema") &&
              !data.error.includes("at ") &&
              !data.error.includes(".ts:")) {
            errorMessage = data.error;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      await fetchDocuments(); // Refresh list
      
      // Open editor with the newly generated document
      if (data.document) {
        setEditingDoc(data.document);
      }
    } catch (err) {
      // Always use friendly message, log real error to console
      console.error("Error generating safety document:", err);
      const errorMessage = err instanceof Error ? err.message : FRIENDLY_ERROR_MESSAGE;
      // Double-check the message doesn't contain sensitive info
      if (errorMessage.toLowerCase().includes("prisma") || 
          errorMessage.toLowerCase().includes("database") ||
          errorMessage.includes("Environment variable")) {
        setError(FRIENDLY_ERROR_MESSAGE);
      } else {
        setError(errorMessage);
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleEdit = (doc: SafetyDocument) => {
    setEditingDoc(doc);
  };

  const handleSave = async (docId: string, updates: { title?: string; content: string; status?: string }) => {
    const SAVE_ERROR = "Unable to save changes right now. Please try again shortly.";
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/safety/${docId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        let errorMessage = SAVE_ERROR;
        try {
          const data = await response.json();
          // Only use API error if it looks safe
          if (data.error && 
              !data.error.toLowerCase().includes("prisma") && 
              !data.error.toLowerCase().includes("database") &&
              !data.error.includes("Environment variable")) {
            errorMessage = data.error;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      await fetchDocuments(); // Refresh list
      setEditingDoc(null);
    } catch (err) {
      console.error("Error saving safety document:", err);
      const errorMessage = err instanceof Error ? err.message : SAVE_ERROR;
      // Double-check the message doesn't contain sensitive info
      if (errorMessage.toLowerCase().includes("prisma") || 
          errorMessage.toLowerCase().includes("database") ||
          errorMessage.includes("Environment variable")) {
        setError(SAVE_ERROR);
      } else {
        setError(errorMessage);
      }
    }
  };

  const getDocument = (type: SafetyDocumentType): SafetyDocument | undefined => {
    return documents.find((d) => d.type === type);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700 border-slate-300",
      generated: "bg-amber-100 text-amber-700 border-amber-300",
      reviewed: "bg-green-100 text-green-700 border-green-300",
    };

    const labels: Record<string, string> = {
      draft: "Draft",
      generated: "Generated",
      reviewed: "Reviewed",
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-slate-600">Loading safety documents...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Safety & SWMS</h2>
            <OvisBadge variant="inline" size="sm" />
          </div>
          <p className="text-xs text-slate-500">
            Generate and manage safety documents for this job
          </p>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{error}</p>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    fetchDocuments();
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* AI Warning Banner */}
          <div className="mb-4">
            <AIWarningBanner variant="compact" />
          </div>

          <div className="space-y-4">
            {DOCUMENT_CONFIGS.map((config) => {
              const doc = getDocument(config.type);
              const isGenerating = generating === config.type;

              return (
                <div
                  key={config.type}
                  className="border border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 text-amber-600">
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 mb-1">{config.label}</h3>
                        <p className="text-xs text-slate-500 mb-2">{config.description}</p>
                        {doc && (
                          <div className="mt-2">
                            {getStatusBadge(doc.status)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {doc ? (
                        <>
                          <button
                            onClick={() => handleEdit(doc)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <SafetyDocumentPdfButton
                            document={doc}
                            jobTitle={jobTitle}
                            tradeType={tradeType}
                            address={address}
                            businessName={businessName}
                          />
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerate(config.type)}
                          disabled={isGenerating || generating !== null}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-1" />
                              Generate {config.type === "SWMS" ? "SWMS" : config.label}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingDoc && (
        <SafetyDocumentEditor
          document={editingDoc}
          onSave={handleSave}
          onCancel={() => setEditingDoc(null)}
        />
      )}
    </>
  );
}

