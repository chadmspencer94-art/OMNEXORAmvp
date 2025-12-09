"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, Save, X } from "lucide-react";
import { formatDateTimeForDisplay, formatDateTimeForInput } from "@/lib/format";

interface ScheduleSectionProps {
  jobId: string;
  scheduledStartAt: string | null | undefined;
  scheduledEndAt: string | null | undefined;
  scheduleNotes: string | null | undefined;
}

export default function ScheduleSection({
  jobId,
  scheduledStartAt: initialScheduledStartAt,
  scheduledEndAt: initialScheduledEndAt,
  scheduleNotes: initialScheduleNotes,
}: ScheduleSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [scheduledStartAt, setScheduledStartAt] = useState(
    initialScheduledStartAt ? formatDateTimeForInput(initialScheduledStartAt) : ""
  );
  const [scheduledEndAt, setScheduledEndAt] = useState(
    initialScheduledEndAt ? formatDateTimeForInput(initialScheduledEndAt) : ""
  );
  const [scheduleNotes, setScheduleNotes] = useState(initialScheduleNotes || "");

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      // Convert to ISO strings
      const startAtISO = scheduledStartAt ? new Date(scheduledStartAt).toISOString() : null;
      const endAtISO = scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null;

      // Validate that end is not before start
      if (startAtISO && endAtISO && new Date(endAtISO) < new Date(startAtISO)) {
        setError("End time cannot be before start time");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/jobs/${jobId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledStartAt: startAtISO,
          scheduledEndAt: endAtISO,
          scheduleNotes: scheduleNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save schedule");
      }

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledStartAt: null,
          scheduledEndAt: null,
          scheduleNotes: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear schedule");
      }

      setScheduledStartAt("");
      setScheduledEndAt("");
      setScheduleNotes("");
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to clear schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setScheduledStartAt(initialScheduledStartAt ? formatDateTimeForInput(initialScheduledStartAt) : "");
    setScheduledEndAt(initialScheduledEndAt ? formatDateTimeForInput(initialScheduledEndAt) : "");
    setScheduleNotes(initialScheduleNotes || "");
  };

  const hasSchedule = initialScheduledStartAt || initialScheduledEndAt || initialScheduleNotes;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>
            <p className="text-xs text-slate-500 mt-1">
              Set the date and time for this job
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              {hasSchedule ? "Edit" : "Set Schedule"}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Schedule updated successfully
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="scheduledStartAt" className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Scheduled Start <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="scheduledStartAt"
                value={scheduledStartAt}
                onChange={(e) => setScheduledStartAt(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="scheduledEndAt" className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Scheduled End <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="datetime-local"
                id="scheduledEndAt"
                value={scheduledEndAt}
                onChange={(e) => setScheduledEndAt(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="scheduleNotes" className="block text-sm font-medium text-slate-700 mb-2">
                Schedule Notes <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                id="scheduleNotes"
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                placeholder="e.g., Client prefers mornings, Access via rear driveway"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-y"
              />
              <p className="mt-1 text-xs text-slate-500">
                Add any special instructions or preferences for scheduling this job
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !scheduledStartAt}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    <span>Save Schedule</span>
                  </>
                )}
              </button>
              {hasSchedule && (
                <button
                  onClick={handleClear}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {hasSchedule ? (
              <>
                {initialScheduledStartAt && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Scheduled Start</p>
                      <p className="text-sm text-slate-900">{formatDateTimeForDisplay(initialScheduledStartAt)}</p>
                    </div>
                  </div>
                )}
                {initialScheduledEndAt && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Scheduled End</p>
                      <p className="text-sm text-slate-900">{formatDateTimeForDisplay(initialScheduledEndAt)}</p>
                    </div>
                  </div>
                )}
                {initialScheduleNotes && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Schedule Notes</p>
                      <p className="text-sm text-slate-900 whitespace-pre-wrap">{initialScheduleNotes}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No schedule set for this job.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

