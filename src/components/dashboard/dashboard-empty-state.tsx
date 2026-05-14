import type { ReactNode } from "react";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";

export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
  embedded = false,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  embedded?: boolean;
}) {
  const content = (
    <>
      {icon && <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">{icon}</div>}
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-white/75">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </>
  );

  if (embedded) {
    return <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">{content}</div>;
  }

  return (
    <DashboardGlassCard className="mt-6 p-8 text-center">
      {content}
    </DashboardGlassCard>
  );
}
