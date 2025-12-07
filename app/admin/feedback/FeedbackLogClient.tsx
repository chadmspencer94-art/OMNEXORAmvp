"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Circle, Loader2, Bug, Lightbulb, HelpCircle, FileText } from "lucide-react";
import type { Feedback, FeedbackCategory, FeedbackMessage } from "@/lib/feedback";

interface FeedbackLogClientProps {
  initialFeedback: Feedback[];
}

interface FeedbackMessageWithRole extends FeedbackMessage {
  authorRole?: string | null;
  authorIsAdmin?: boolean;
}

const categoryIcons: Record<FeedbackCategory, React.ReactNode> = {
  bug: <Bug className="w-4 h-4" />,
  idea: <Lightbulb className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  other: <FileText className="w-4 h-4" />,
};

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: "Bug",
  idea: "Idea",
  question: "Question",
  other: "Other",
};

const categoryColors: Record<FeedbackCategory, string> = {
  bug: "bg-red-100 text-red-700 border-red-200",
  idea: "bg-purple-100 text-purple-700 border-purple-200",
  question: "bg-blue-100 text-blue-700 border-blue-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackLogClient({ initialFeedback }: FeedbackLogClientProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, FeedbackMessageWithRole[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Set<string>>(new Set());

  const handleToggleResolution = async (id: string, currentResolved: boolean) => {
    setLoadingIds((prev) => new Set(prev).add(id));

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: id,
          resolved: !currentResolved,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update feedback");
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }

      // Update local state
      setFeedback((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, resolved: !currentResolved, resolvedAt: !currentResolved ? new Date().toISOString() : null }
            : f
        )
      );

      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Refresh to get fresh data
      router.refresh();
    } catch (err) {
      console.error("Error updating feedback:", err);
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch messages when expanding
        if (!feedbackMessages[id] && !loadingMessages.has(id)) {
          fetchFeedbackMessages(id);
        }
      }
      return next;
    });
  };

  const fetchFeedbackMessages = async (feedbackId: string) => {
    setLoadingMessages((prev) => new Set(prev).add(feedbackId));
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setFeedbackMessages((prev) => ({
          ...prev,
          [feedbackId]: data.messages || [],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch feedback messages:", error);
    } finally {
      setLoadingMessages((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  };

  const filteredFeedback = feedback.filter((f) => {
    if (filter === "open") return !f.resolved;
    if (filter === "resolved") return f.resolved;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({feedback.length})
        </button>
        <button
          onClick={() => setFilter("open")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "open"
              ? "bg-amber-500 text-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Open ({feedback.filter((f) => !f.resolved).length})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "resolved"
              ? "bg-green-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Resolved ({feedback.filter((f) => f.resolved).length})
        </button>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredFeedback.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No {filter === "open" ? "open" : filter === "resolved" ? "resolved" : ""} feedback to display.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredFeedback.map((item) => {
              const isLoading = loadingIds.has(item.id);
              const isExpanded = expandedIds.has(item.id);
              const isLongMessage = item.message.length > 200;

              return (
                <div
                  key={item.id}
                  className={`p-4 ${item.resolved ? "bg-slate-50" : "bg-white"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Resolution status icon */}
                    <button
                      onClick={() => handleToggleResolution(item.id, item.resolved)}
                      disabled={isLoading}
                      className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                        item.resolved
                          ? "text-green-600 hover:bg-green-100"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      } disabled:opacity-50`}
                      title={item.resolved ? "Mark as open" : "Mark as resolved"}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : item.resolved ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${categoryColors[item.category]}`}>
                          {categoryIcons[item.category]}
                          {categoryLabels[item.category]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(item.createdAt)}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-600 font-medium truncate">
                          {item.userEmail}
                        </span>
                        {item.jobId && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <Link
                              href={`/jobs/${item.jobId}`}
                              className="text-xs text-amber-600 hover:text-amber-700"
                            >
                              Job #{item.jobId.slice(-8)}
                            </Link>
                          </>
                        )}
                        {item.resolved && item.resolvedAt && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-green-600">
                              Resolved {formatDate(item.resolvedAt)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Initial Message */}
                      <div className="text-sm text-slate-700">
                        {isLongMessage && !isExpanded ? (
                          <>
                            <p>{item.message.slice(0, 200)}...</p>
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="text-amber-600 hover:text-amber-700 text-xs font-medium mt-1"
                            >
                              Show more
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{item.message}</p>
                            {isLongMessage && (
                              <button
                                onClick={() => toggleExpanded(item.id)}
                                className="text-amber-600 hover:text-amber-700 text-xs font-medium mt-1"
                              >
                                Show less
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Messages/Replies */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="space-y-3">
                            {loadingMessages.has(item.id) ? (
                              <div className="text-xs text-slate-500">Loading messages...</div>
                            ) : feedbackMessages[item.id]?.length > 0 ? (
                              feedbackMessages[item.id].map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`p-3 rounded-lg ${
                                    msg.authorIsAdmin
                                      ? "bg-purple-50 border border-purple-200"
                                      : "bg-slate-50 border border-slate-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-900">
                                      {msg.authorName || msg.authorEmail || "Unknown"}
                                    </span>
                                    {msg.authorIsAdmin && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-600 text-white">
                                        Admin
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                      {formatDate(msg.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {msg.message}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-500">No replies yet.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

