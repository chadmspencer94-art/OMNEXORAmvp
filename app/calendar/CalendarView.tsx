"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Job } from "@/lib/jobs";

interface CalendarViewProps {
  year: number;
  month: number;
  jobs: Job[];
}

function getStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    booked: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return colors[status || "pending"] || "bg-slate-100 text-slate-700 border-slate-200";
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CalendarView({ year, month, jobs }: CalendarViewProps) {
  const router = useRouter();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Adjust for Monday-first week (0 = Monday, 6 = Sunday)
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped: Record<string, Job[]> = {};
    jobs.forEach((job) => {
      if (!job.scheduledStartAt) return;
      const date = new Date(job.scheduledStartAt);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(job);
    });
    return grouped;
  }, [jobs]);
  
  // Navigate to previous/next month
  const navigateMonth = (direction: "prev" | "next") => {
    let newYear = year;
    let newMonth = month;
    
    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }
    
    router.push(`/calendar?year=${newYear}&month=${newMonth}`);
  };
  
  // Get today's date for highlighting
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;
  
  // Generate calendar days
  const calendarDays: Array<{ day: number | null; dateKey: string | null; isToday: boolean; isCurrentMonth: boolean }> = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedStartingDay; i++) {
    calendarDays.push({ day: null, dateKey: null, isToday: false, isCurrentMonth: false });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({
      day,
      dateKey,
      isToday: day === todayDate,
      isCurrentMonth: true,
    });
  }
  
  // Month name
  const monthName = firstDay.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{monthName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
              }}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
            <div
              key={dayName}
              className="text-center text-xs font-semibold text-slate-500 py-2"
            >
              {dayName}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((calDay, idx) => {
            if (calDay.day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square border border-slate-100 rounded-lg bg-slate-50"
                />
              );
            }
            
            const dayJobs = calDay.dateKey ? jobsByDate[calDay.dateKey] || [] : [];
            
            return (
              <div
                key={calDay.dateKey}
                className={`aspect-square border rounded-lg p-2 overflow-y-auto ${
                  calDay.isToday
                    ? "border-amber-500 bg-amber-50"
                    : calDay.isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    calDay.isToday
                      ? "text-amber-700"
                      : calDay.isCurrentMonth
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {calDay.day}
                </div>
                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className={`block px-2 py-1 rounded text-xs font-medium border truncate hover:opacity-80 transition-opacity ${getStatusColor(job.jobStatus)}`}
                      title={`${job.title} - ${formatTime(job.scheduledStartAt!)}`}
                    >
                      <div className="truncate">{job.title}</div>
                      <div className="text-xs opacity-75">{formatTime(job.scheduledStartAt!)}</div>
                    </Link>
                  ))}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayJobs.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-slate-700">Status:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
            Pending
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
            Booked
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
            Completed
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        </div>
      </div>
    </div>
  );
}

