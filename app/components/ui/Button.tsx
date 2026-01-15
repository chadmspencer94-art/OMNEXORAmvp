import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
  asLink?: boolean;
  href?: string;
}

/**
 * Button component with mobile-optimized touch targets
 * - Minimum 44px touch target on mobile (Apple HIG recommendation)
 * - Larger padding and font sizes for better accessibility
 */
export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  asLink = false,
  href,
  disabled,
  ...props
}: ButtonProps) {
  // Base styles include minimum touch target for mobile (min-h-[44px])
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation";
  
  const variantStyles = {
    primary: "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/25 focus:ring-amber-500",
    secondary: "bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 focus:ring-slate-500",
    ghost: "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 focus:ring-slate-500",
    danger: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-500",
  };
  
  // Mobile-optimized sizes with minimum 44px touch target
  const sizeStyles = {
    sm: "px-3 py-2 text-sm min-h-[40px]",
    md: "px-4 py-3 text-base min-h-[44px]",
    lg: "px-6 py-3.5 text-lg min-h-[48px]",
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  if (asLink && href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }
  
  return (
    <button className={combinedClassName} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

