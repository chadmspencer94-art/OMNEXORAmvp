import StructuredBadge from "./StructuredBadge";

interface OmnexoraHeaderProps {
  verificationStatus?: "unverified" | "pending" | "verified" | "pending_review" | "rejected";
  showEarlyAccess?: boolean;
}

export default function OmnexoraHeader({
  verificationStatus,
  showEarlyAccess = true,
}: OmnexoraHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-3">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            OMNEXORA
          </h1>
          <p className="text-xs text-slate-500">
            Trades AI Job Packs
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {verificationStatus === "verified" && <StructuredBadge />}
        {showEarlyAccess && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            Early access
          </span>
        )}
      </div>
    </div>
  );
}

