"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface OvisBadgeProps {
  variant?: "inline" | "card";
  size?: "sm" | "md";
  className?: string;
}

/**
 * OVIS Badge - Trust mark for OMNEXORA Verified Intelligence Systems
 * 
 * Displays a subtle badge indicating that outputs are AI-assisted drafts
 * validated by OMNEXORA rules and user verification.
 * 
 * Responsive: Shows subtext "AI-assisted • human-checked" on md+ screens only.
 * Mobile: Shows only "OVIS Verified"
 */
export default function OvisBadge({ 
  variant = "inline", 
  size = "md",
  className = "" 
}: OvisBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipText = "OVIS (OMNEXORA Verified Intelligence Systems) indicates AI-assisted drafts validated by OMNEXORA rules and user verification before use.";
  
  const isSmall = size === "sm";
  const iconSize = isSmall ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSize = isSmall ? "text-xs" : "text-xs";
  const padding = isSmall ? "px-2 py-0.5" : "px-2.5 py-1";

  // Inline variant (default) - for document sections, headers
  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 ${padding} ${textSize} font-medium text-slate-700 border border-slate-200`}>
          <svg className={`${iconSize} text-slate-500`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>OVIS Verified</span>
        </span>
        <span className="hidden md:inline text-xs text-slate-500">AI-assisted • human-checked</span>
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="OVIS information"
          >
            <Info className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </button>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-50 pointer-events-none">
              <p>{tooltipText}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant - for standalone cards/sections
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 ${padding} ${textSize} font-medium text-slate-700 border border-slate-200`}>
        <svg className={`${iconSize} text-slate-500`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>OVIS Verified</span>
      </span>
      <span className="hidden md:inline text-xs text-slate-500">AI-assisted • human-checked</span>
      <div className="relative">
        <button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="OVIS information"
        >
          <Info className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-50 pointer-events-none">
            <p>{tooltipText}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}

