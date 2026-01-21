"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2, FileText, Edit2, Shield, AlertTriangle, Users, RefreshCw,
  ChevronDown, ChevronUp, X, Check
} from "lucide-react";
import SafetyDocumentEditor from "./SafetyDocumentEditor";
import SafetyDocumentPdfButton from "./SafetyDocumentPdfButton";
import OvisBadge from "@/app/components/OvisBadge";

const FRIENDLY_ERROR_MESSAGE = "Safety documents aren't available right now. Please try again shortly.";

interface BusinessProfile {
  legalName?: string;
  tradingName?: string;
  abn?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
}

interface SafetySectionProps {
  jobId: string;
  jobTitle: string;
  tradeType: string;
  address?: string;
  businessName?: string;
  businessProfile?: BusinessProfile | null;
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
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
}

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  {
    type: "SWMS",
    label: "Safe Work Method Statement",
    shortLabel: "SWMS",
    description: "Safe Work Method Statement",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    type: "RISK_ASSESSMENT",
    label: "Risk Assessment",
    shortLabel: "Risk Assessment",
    description: "Hazard identification and controls",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    type: "TOOLBOX_TALK",
    label: "Toolbox Talk",
    shortLabel: "Toolbox Talk",
    description: "Safety briefing outline",
    icon: <Users className="w-4 h-4" />,
  },
];

export default function SafetySection({
  jobId,
  jobTitle,
  tradeType,
  address,
  businessName,
  businessProfile,
}: SafetySectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<SafetyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<SafetyDocumentType | null>(null);
  const [editingDoc, setEditingDoc] = useState<SafetyDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
    checkEmailVerification();
  }, [jobId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkEmailVerification = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setEmailVerified(!!data.user?.emailVerifiedAt);
      } else {
        setEmailVerified(false);
      }
    } catch {
      setEmailVerified(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}/safety`);
      if (!response.ok) {
        try {
          const data = await response.json();
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
      setError(FRIENDLY_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type: SafetyDocumentType) => {
    setGenerating(type);
    setError(null);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/jobs/${jobId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        let errorMessage = FRIENDLY_ERROR_MESSAGE;
        try {
          const data = await response.json();
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
        setError(errorMessage);
        setGenerating(null);
        return;
      }

      const data = await response.json();
      await fetchDocuments();
      
      if (data.document) {
        setEditingDoc(data.document);
      }
    } catch (err) {
      console.error("Error generating safety document:", err);
      setError(FRIENDLY_ERROR_MESSAGE);
    } finally {
      setGenerating(null);
    }
  };

  const handleSelectDocument = (config: DocumentConfig) => {
    const existingDoc = documents.find(d => d.type === config.type);
    setIsOpen(false);
    
    if (existingDoc) {
      setEditingDoc(existingDoc);
    } else {
      handleGenerate(config.type);
    }
  };

  const handleSave = async (docId: string, updates: { title?: string; content: string; status?: string }) => {
    const SAVE_ERROR = "Unable to save changes right now. Please try again shortly.";
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/safety/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        let errorMessage = SAVE_ERROR;
        try {
          const data = await response.json();
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

      await fetchDocuments();
      setEditingDoc(null);
    } catch (err) {
      console.error("Error saving safety document:", err);
      const errorMessage = err instanceof Error ? err.message : SAVE_ERROR;
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

  const generatedCount = documents.length;
  const reviewedCount = documents.filter(d => d.status === "reviewed").length;
  const isDisabled = emailVerified === false;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          </div>
          <span className="text-sm text-slate-600">Loading safety documents...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Safety & SWMS</h3>
                  <OvisBadge variant="inline" size="sm" />
                </div>
                <p className="text-xs text-slate-500">
                  {generatedCount > 0 ? (
                    <span>{generatedCount} generated{reviewedCount > 0 && `, ${reviewedCount} reviewed`}</span>
                  ) : (
                    "Generate safety documents"
                  )}
                </p>
              </div>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={generating !== null || isDisabled}
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                title={isDisabled ? "Email verification required" : undefined}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Safety
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-500 font-medium">Select a safety document</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {DOCUMENT_CONFIGS.map((config) => {
                      const doc = getDocument(config.type);
                      return (
                        <button
                          key={config.type}
                          onClick={() => handleSelectDocument(config)}
                          className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            doc?.status === "reviewed" ? "bg-emerald-100" : doc ? "bg-amber-100" : "bg-slate-100"
                          }`}>
                            <span className={
                              doc?.status === "reviewed" ? "text-emerald-600" : doc ? "text-amber-600" : "text-slate-400"
                            }>
                              {config.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{config.shortLabel}</span>
                              {doc?.status === "reviewed" && <Check className="w-3 h-3 text-emerald-600" />}
                              {doc && doc.status !== "reviewed" && (
                                <span className="text-xs text-amber-600 font-medium capitalize">{doc.status}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{config.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Email verification warning */}
          {isDisabled && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-800">
                  <Link href="/settings" className="underline font-medium">Verify your email</Link> to generate safety documents.
                </p>
              </div>
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <p className="text-xs text-red-700">{error}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setError(null);
                    fetchDocuments();
                  }}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button onClick={() => setError(null)} className="p-1 text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Quick access to generated documents */}
          {documents.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {documents.map((doc) => {
                const config = DOCUMENT_CONFIGS.find(c => c.type === doc.type);
                return (
                  <div key={doc.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-slate-50 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setEditingDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                    >
                      {config?.icon}
                      {config?.shortLabel}
                    </button>
                    <SafetyDocumentPdfButton
                      document={doc}
                      jobTitle={jobTitle}
                      tradeType={tradeType}
                      address={address}
                      businessName={businessName}
                      businessProfile={businessProfile}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          )}
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
