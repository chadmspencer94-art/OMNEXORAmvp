import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  header,
  footer,
  padding = "md",
  hover = false,
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  
  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200 shadow-sm
        ${paddingStyles[padding]}
        ${hover ? "hover:shadow-md transition-shadow" : ""}
        ${className}
      `}
    >
      {header && (
        <div className="border-b border-slate-200 pb-4 mb-4">
          {header}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          {footer}
        </div>
      )}
    </div>
  );
}

