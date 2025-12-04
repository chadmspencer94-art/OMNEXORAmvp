"use client";

import { useState } from "react";
import { MessageSquare, X, Loader2, CheckCircle } from "lucide-react";

interface FeedbackButtonProps {
  jobId?: string;
  variant?: "default" | "compact";
}

type FeedbackCategory = "bug" | "idea" | "question" | "other";

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: "🐛 Bug / Issue",
  idea: "💡 Idea / Suggestion",
  question: "❓ Question",
  other: "📝 Other",
};

export default function FeedbackButton({ jobId, variant = "default" }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("other");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setError("");
    setSuccess(false);
    setMessage("");
    setCategory("other");
  };

  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter your feedback message");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category,
          jobId: jobId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit feedback");
        setIsSubmitting(false);
        return;
      }

      // Success!
      setSuccess(true);
      setIsSubmitting(false);

      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const placeholder = jobId
    ? "Spotted something off in this job pack? Tell us what's wrong or what you'd change."
    : "Tell us what's working, what's confusing, or what you'd improve.";

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={
          variant === "compact"
            ? "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            : "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        }
      >
        <MessageSquare className="w-4 h-4" />
        <span>{jobId ? "Feedback" : "Send feedback"}</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Send feedback
              </h3>
              <button
                onClick={handleClose}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {success ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">
                  Thanks for your feedback!
                </h4>
                <p className="text-sm text-slate-600">
                  We appreciate you taking the time to help us improve OMNEXORA.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(categoryLabels) as FeedbackCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          category === cat
                            ? "border-amber-500 bg-amber-50 text-amber-900"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {categoryLabels[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-700 mb-2">
                    Your feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Job context indicator */}
                {jobId && (
                  <p className="text-xs text-slate-500">
                    This feedback will be associated with job #{jobId.slice(-8)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? "Sending..." : "Send feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

