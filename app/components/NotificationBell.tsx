"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Megaphone } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actorName?: string;
}

/**
 * NotificationBell Component
 * 
 * Displays a bell icon with unread count badge.
 * When clicked, shows a dropdown with recent notifications.
 * Supports marking notifications as read.
 */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/me/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.warn("Failed to fetch notifications:", error);
    }
  };

  // Fetch on mount and periodically
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/me/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.warn("Failed to mark notifications as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  };

  // Get icon color based on notification type
  const getTypeColor = (type: string) => {
    switch (type) {
      case "ADMIN_ANNOUNCEMENT":
        return "bg-purple-100 text-purple-600";
      case "COMMENT":
      case "TAG":
      case "MENTION":
        return "bg-blue-100 text-blue-600";
      case "QUOTE_ACCEPTED":
        return "bg-green-100 text-green-600";
      case "QUOTE_DECLINED":
        return "bg-red-100 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Get icon based on notification type
  const getTypeIcon = (type: string) => {
    if (type === "ADMIN_ANNOUNCEMENT") {
      return <Megaphone className="w-4 h-4" />;
    }
    return <Bell className="w-4 h-4" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 min-w-[44px] min-h-[44px] text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors touch-manipulation"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
                <p className="text-slate-400 text-xs mt-1">
                  You'll see updates here when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Type Indicator */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {notification.actorName && `${notification.actorName} • `}
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      
                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
