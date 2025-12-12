"use client";

import { X } from "lucide-react";

interface OvisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * OVIS Modal - Explains what OVIS is
 * Simple modal component matching existing design patterns
 */
export default function OvisModal({ isOpen, onClose }: OvisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              What is OVIS?
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">
                OVIS Verified Intelligence
              </h4>
              <p className="hidden md:block text-sm text-slate-600 leading-relaxed mb-3">
                AI-assisted drafts with human verification before issue.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                OVIS (OMNEXORA Verified Intelligence Systems) indicates AI-assisted drafts validated by OMNEXORA rules and user verification before use.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                All OVIS-verified documents are reviewed and confirmed by you before being sent to clients or used in your business.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

