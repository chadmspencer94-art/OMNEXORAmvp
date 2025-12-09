import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "default",
  className = "",
  size = "md",
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full border";
  
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}

