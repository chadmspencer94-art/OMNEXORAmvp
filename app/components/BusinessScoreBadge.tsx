"use client";

import { useState, useEffect } from "react";
import { Star, TrendingUp, Award, Loader2 } from "lucide-react";
import Link from "next/link";

interface BusinessScoreBadgeProps {
  size?: "sm" | "md" | "lg";
  showStars?: boolean;
  showLabel?: boolean;
  linkToAnalytics?: boolean;
}

const RATING_TIERS = {
  PLATINUM: { min: 90, label: "Platinum", color: "from-slate-400 to-slate-600", bgColor: "bg-slate-100", textColor: "text-slate-700" },
  GOLD: { min: 75, label: "Gold", color: "from-amber-400 to-amber-600", bgColor: "bg-amber-100", textColor: "text-amber-700" },
  SILVER: { min: 60, label: "Silver", color: "from-slate-300 to-slate-400", bgColor: "bg-slate-100", textColor: "text-slate-600" },
  BRONZE: { min: 40, label: "Bronze", color: "from-orange-300 to-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  STARTER: { min: 0, label: "Starter", color: "from-slate-200 to-slate-300", bgColor: "bg-slate-50", textColor: "text-slate-500" },
};

type RatingTier = keyof typeof RATING_TIERS;

function getRatingTier(score: number): RatingTier {
  if (score >= RATING_TIERS.PLATINUM.min) return "PLATINUM";
  if (score >= RATING_TIERS.GOLD.min) return "GOLD";
  if (score >= RATING_TIERS.SILVER.min) return "SILVER";
  if (score >= RATING_TIERS.BRONZE.min) return "BRONZE";
  return "STARTER";
}

export default function BusinessScoreBadge({
  size = "md",
  showStars = true,
  showLabel = true,
  linkToAnalytics = true,
}: BusinessScoreBadgeProps) {
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        const response = await fetch("/api/me/advanced-analytics");
        if (response.ok) {
          const data = await response.json();
          setScore(data.totalScore);
        }
      } catch (error) {
        console.error("Failed to fetch business score:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchScore();
  }, []);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1 ${size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"}`}>
        <Loader2 className={`animate-spin ${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"}`} />
      </div>
    );
  }

  if (score === null) {
    return null;
  }

  const tier = getRatingTier(score);
  const tierInfo = RATING_TIERS[tier];
  const stars = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;

  const sizeClasses = {
    sm: {
      container: "gap-1 px-2 py-1",
      icon: "w-3 h-3",
      score: "text-xs font-semibold",
      label: "text-xs",
      star: "w-3 h-3",
    },
    md: {
      container: "gap-2 px-3 py-1.5",
      icon: "w-4 h-4",
      score: "text-sm font-bold",
      label: "text-xs",
      star: "w-3.5 h-3.5",
    },
    lg: {
      container: "gap-3 px-4 py-2",
      icon: "w-5 h-5",
      score: "text-lg font-bold",
      label: "text-sm",
      star: "w-4 h-4",
    },
  };

  const classes = sizeClasses[size];

  const content = (
    <div
      className={`inline-flex items-center ${classes.container} rounded-full ${tierInfo.bgColor} border border-slate-200/50 ${linkToAnalytics ? "hover:shadow-md transition-shadow cursor-pointer" : ""}`}
    >
      {/* Tier Icon */}
      <div className={`bg-gradient-to-br ${tierInfo.color} rounded-full p-1`}>
        <Award className={`${classes.icon} text-white`} />
      </div>

      {/* Score */}
      <span className={`${classes.score} ${tierInfo.textColor}`}>{score}</span>

      {/* Stars */}
      {showStars && (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`${classes.star} ${s <= stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
            />
          ))}
        </div>
      )}

      {/* Label */}
      {showLabel && (
        <span className={`${classes.label} ${tierInfo.textColor} font-medium`}>
          {tierInfo.label}
        </span>
      )}
    </div>
  );

  if (linkToAnalytics) {
    return (
      <Link href="/dashboard/analytics" title="View Advanced Analytics">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Compact version for displaying in headers/navbars
 */
export function BusinessScoreMini() {
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        const response = await fetch("/api/me/advanced-analytics");
        if (response.ok) {
          const data = await response.json();
          setScore(data.totalScore);
        }
      } catch (error) {
        console.error("Failed to fetch business score:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchScore();
  }, []);

  if (isLoading || score === null) {
    return null;
  }

  const tier = getRatingTier(score);
  const tierInfo = RATING_TIERS[tier];

  return (
    <Link
      href="/dashboard/analytics"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${tierInfo.bgColor} hover:opacity-90 transition-opacity`}
      title={`Business Score: ${score} (${tierInfo.label})`}
    >
      <TrendingUp className={`w-3.5 h-3.5 ${tierInfo.textColor}`} />
      <span className={`text-sm font-semibold ${tierInfo.textColor}`}>{score}</span>
    </Link>
  );
}

/**
 * Public-facing rating display (for marketplace, etc.)
 */
export function PublicRatingDisplay({
  score,
  showTierLabel = true,
}: {
  score: number;
  showTierLabel?: boolean;
}) {
  const tier = getRatingTier(score);
  const tierInfo = RATING_TIERS[tier];
  const stars = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
          />
        ))}
      </div>
      <span className={`text-sm font-semibold ${tierInfo.textColor}`}>
        {stars.toFixed(1)}
      </span>
      {showTierLabel && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${tierInfo.bgColor} ${tierInfo.textColor} font-medium`}>
          {tierInfo.label}
        </span>
      )}
    </div>
  );
}
