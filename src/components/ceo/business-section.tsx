import Link from "next/link";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { CEO_DASHBOARD_PATH } from "@/lib/ceo-platform";
import { getCeoBusinessesPage } from "@/lib/ceo-queries";
import type { BusinessStatus } from "@prisma/client";

import { BusinessRowActions } from "./business-row-actions";

function buildQuery(base: Record<string, string | undefined>, updates: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged = { ...base, ...updates };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  const s = p.toString();
  return s;
}

export async function CeoBusinessSection({
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
  const page = Math.max(1, Number(searchParams.bpage) || 1);
  const pageSize = 12;
  const q = searchParams.bq?.trim() ?? "";
  const statusRaw = searchParams.bstatus ?? "all";
  const status =
    statusRaw === "all" || !statusRaw
      ? "all"
      : (["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"] as const).includes(statusRaw as BusinessStatus)
        ? (statusRaw as BusinessStatus)
        : "all";

  const baseQs: Record<string, string | undefined> = {
    ...(q ? { bq: q } : {}),
    ...(status !== "all" ? { bstatus: status } : {}),
    ...(searchParams.uq?.trim() ? { uq: searchParams.uq.trim() } : {}),
    ...(searchParams.urole ? { urole: searchParams.urole } : {}),
    ...(searchParams.upage ? { upage: searchParams.upage } : {}),
  };

  const result = await getCeoBusinessesPage({ page, pageSize, q, status });

  if (!result.ok) {
    return (
      <DashboardGlassCard className="p-6" id="business">
        <p className="text-sm text-red-200">Impossible de charger les business : {result.error}</p>
      </DashboardGlassCard>
    );
  }

  const { rows, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <DashboardGlassCard className="overflow-hidden p-0" id="business">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-bold">Gestion business</h2>
        <p className="text-sm text-white/65">{total} fiche(s) — actions sécurisées côté serveur</p>
        <div className="mt-3">
          <DashboardFilterBar
            query={q}
            queryName="bq"
            queryPlaceholder="Rechercher nom, slug, email owner…"
            status={status === "all" ? "all" : status}
            statusName="bstatus"
            options={[
              { value: "all", label: "Tous statuts" },
              { value: "PENDING", label: "En attente" },
              { value: "ACTIVE", label: "Actif" },
              { value: "SUSPENDED", label: "Suspendu" },
              { value: "REJECTED", label: "Rejeté" },
            ]}
            resultsCount={total}
            action={CEO_DASHBOARD_PATH}
            formClassName="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            hiddenFields={[
              { name: "bpage", value: "1" },
              ...(searchParams.uq?.trim() ? [{ name: "uq", value: searchParams.uq.trim() }] : []),
              ...(searchParams.urole ? [{ name: "urole", value: searchParams.urole }] : []),
              ...(searchParams.upage ? [{ name: "upage", value: searchParams.upage }] : []),
            ]}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
            <tr>
              <th className="px-3 py-3">Business</th>
              <th className="px-3 py-3">Ville</th>
              <th className="px-3 py-3">Catégorie</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3">Abo.</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3">Créé</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-3 py-3 font-medium">
                  <div>{b.name}</div>
                  <div className="text-xs text-white/45">{b.slug}</div>
                </td>
                <td className="px-3 py-3 text-white/80">{b.cityName}</td>
                <td className="px-3 py-3 text-white/80">{b.categoryName}</td>
                <td className="px-3 py-3">
                  <div className="text-white/85">{b.ownerEmail}</div>
                  {b.ownerName && <div className="text-xs text-white/45">{b.ownerName}</div>}
                </td>
                <td className="px-3 py-3 text-xs text-cyan-200/90">
                  {b.subscriptionPlan} / {b.subscriptionStatus}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      b.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-100"
                        : b.status === "SUSPENDED"
                          ? "bg-amber-500/20 text-amber-100"
                          : b.status === "REJECTED"
                            ? "bg-red-500/20 text-red-100"
                            : "bg-white/10 text-white/70",
                    ].join(" ")}
                  >
                    {b.status}
                  </span>
                  {b.verified && (
                    <span className="ml-1 text-[10px] text-cyan-300/80" title="Vérifié">
                      ✓
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-white/55">{b.createdAt.toLocaleDateString("fr-FR")}</td>
                <td className="px-3 py-3">
                  <BusinessRowActions id={b.id} slug={b.slug} />
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
              href={`${CEO_DASHBOARD_PATH}?${buildQuery(baseQs, { bpage: String(page - 1) })}`}
            >
              Précédent
            </Link>
          ) : (
            <span className="rounded-lg border border-white/10 px-3 py-1 text-white/35">Précédent</span>
          )}
          {page < totalPages ? (
            <Link
              className="rounded-lg border border-white/20 px-3 py-1 hover:border-cyan-300/35"
              href={`${CEO_DASHBOARD_PATH}?${buildQuery(baseQs, { bpage: String(page + 1) })}`}
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
