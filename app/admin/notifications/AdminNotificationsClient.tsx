"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Users, User, Briefcase, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface NotificationHistory {
  title: string;
  message: string;
  type: string;
  actorName: string;
  createdAt: string;
  recipientCount: number;
}

export default function AdminNotificationsClient() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "role">("all");
  const [targetRole, setTargetRole] = useState<string>("tradie");
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch notification history
  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.announcements || []);
      }
    } catch (error) {
      console.error("Failed to fetch notification history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setErrorMessage("Please fill in both title and message");
      return;
    }

    setIsSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetRole: targetType === "role" ? targetRole : "all",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const count = data.count || 0;
        setSuccessMessage(data.message || `Notification sent to ${count} user${count !== 1 ? 's' : ''}!`);
        setTitle("");
        setMessage("");
        fetchHistory(); // Refresh history
      } else {
        setErrorMessage(data.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Send Notification Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Send Notification
            </h2>
            <p className="text-sm text-slate-500">
              Create and send a notification to users
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Feature Available!"
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your notification message here..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Send to
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType("all")}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  targetType === "all"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">All Users</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType("role")}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  targetType === "role"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">By Role</span>
              </button>
            </div>
          </div>

          {/* Role Selection (when targetType === "role") */}
          {targetType === "role" && (
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Select Role
              </label>
              <select
                id="role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
              >
                <option value="tradie">Tradies / Business</option>
                <option value="client">Clients</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          )}

          {/* Status Messages */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSending || !title.trim() || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-lg transition-colors"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Notification</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Notifications
            </h2>
            <p className="text-sm text-slate-500">
              History of sent notifications
            </p>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No notifications sent yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Sent notifications will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {history.map((notification, index) => (
              <div
                key={`${notification.title}-${notification.createdAt}-${index}`}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-slate-900 text-sm line-clamp-1">
                    {notification.title}
                  </h3>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {notification.recipientCount} {notification.recipientCount === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {notification.message}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
