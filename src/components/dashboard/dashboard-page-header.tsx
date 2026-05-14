import type { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  subtitle,
  statusBadge,
  action,
}: {
  title: string;
  subtitle: string;
  statusBadge?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="text-sm text-white/70">{subtitle}</p>
        {statusBadge && (
          <span className="mt-2 inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            {statusBadge}
          </span>
        )}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
