import Link from "next/link";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { CEO_DASHBOARD_PATH, formatUserRoleForUi } from "@/lib/ceo-platform";
import { getCeoUsersPage } from "@/lib/ceo-queries";
import type { UserRole } from "@prisma/client";

import { UserRowActions } from "./user-row-actions";

function buildQuery(base: Record<string, string | undefined>, updates: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged = { ...base, ...updates };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  return p.toString();
}

export async function CeoUsersSection({
  searchParams,
}: {
  searchParams: {
    bq?: string;
    bstatus?: string;
    bpage?: string;
    uq?: string;
    urole?: string;
    upage?: string;
  };
}) {
  const page = Math.max(1, Number(searchParams.upage) || 1);
  const pageSize = 12;
  const q = searchParams.uq?.trim() ?? "";
  const roleRaw = searchParams.urole ?? "all";
  const role =
    roleRaw === "all" || !roleRaw
      ? "all"
      : (["SUPER_ADMIN", "BUSINESS_OWNER", "AGENT", "CLIENT"] as const).includes(roleRaw as UserRole)
        ? (roleRaw as UserRole)
        : "all";

  const baseQs: Record<string, string | undefined> = {
    ...(searchParams.bq?.trim() ? { bq: searchParams.bq.trim() } : {}),
    ...(searchParams.bstatus && searchParams.bstatus !== "all" ? { bstatus: searchParams.bstatus } : {}),
    ...(searchParams.bpage ? { bpage: searchParams.bpage } : {}),
    ...(q ? { uq: q } : {}),
    ...(role !== "all" ? { urole: role } : {}),
  };

  const result = await getCeoUsersPage({ page, pageSize, q, role });

  if (!result.ok) {
    return (
      <DashboardGlassCard className="p-6" id="users">
        <p className="text-sm text-red-200">Impossible de charger les utilisateurs : {result.error}</p>
      </DashboardGlassCard>
    );
  }

  const { rows, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <DashboardGlassCard className="overflow-hidden p-0" id="users">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-bold">Gestion utilisateurs</h2>
        <p className="text-sm text-white/65">
          {total} compte(s) — activité = compteurs Prisma (business, paiements, signalements)
        </p>
        <div className="mt-3">
          <DashboardFilterBar
            query={q}
            queryName="uq"
            queryPlaceholder="Email ou nom…"
            status={role === "all" ? "all" : role}
            statusName="urole"
            options={[
              { value: "all", label: "Tous rôles" },
              { value: "SUPER_ADMIN", label: "CEO" },
              { value: "BUSINESS_OWNER", label: "Business" },
              { value: "AGENT", label: "Agent" },
              { value: "CLIENT", label: "Client" },
            ]}
            resultsCount={total}
            action={CEO_DASHBOARD_PATH}
            formClassName="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            hiddenFields={[
              { name: "upage", value: "1" },
              ...(searchParams.bq?.trim() ? [{ name: "bq", value: searchParams.bq.trim() }] : []),
              ...(searchParams.bstatus ? [{ name: "bstatus", value: searchParams.bstatus }] : []),
              ...(searchParams.bpage ? [{ name: "bpage", value: searchParams.bpage }] : []),
            ]}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
            <tr>
              <th className="px-3 py-3">Utilisateur</th>
              <th className="px-3 py-3">Rôle</th>
              <th className="px-3 py-3">Activité</th>
              <th className="px-3 py-3">Inscrit</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-3 py-3">
                  <div className="font-medium text-white/90">{u.email}</div>
                  {u.name && <div className="text-xs text-white/45">{u.name}</div>}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-100">
                    {formatUserRoleForUi(u.role)}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-white/70">
                  <div>Business: {u.businessesCount}</div>
                  <div>Paiements: {u.paymentsCount}</div>
                  <div>Signalements: {u.reportsCount}</div>
                </td>
                <td className="px-3 py-3 text-xs text-white/55">{u.createdAt.toLocaleDateString("fr-FR")}</td>
                <td className="px-3 py-3">
                  <UserRowActions userId={u.id} currentRole={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-sm">
        <span className="text-white/55">
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              className="rounded-lg border border-white/20 px-3 py-1 hover:border-cyan-300/35"
              href={`${CEO_DASHBOARD_PATH}?${buildQuery(baseQs, { upage: String(page - 1) })}`}
            >
              Précédent
            </Link>
          ) : (
            <span className="rounded-lg border border-white/10 px-3 py-1 text-white/35">Précédent</span>
          )}
          {page < totalPages ? (
            <Link
              className="rounded-lg border border-white/20 px-3 py-1 hover:border-cyan-300/35"
              href={`${CEO_DASHBOARD_PATH}?${buildQuery(baseQs, { upage: String(page + 1) })}`}
            >
              Suivant
            </Link>
          ) : (
            <span className="rounded-lg border border-white/10 px-3 py-1 text-white/35">Suivant</span>
          )}
        </div>
      </div>
    </DashboardGlassCard>
  );
}
