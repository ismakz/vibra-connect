import Link from "next/link";
import { Shield } from "lucide-react";

import { CeoAnalyticsCharts } from "@/components/ceo/analytics-charts";
import { AgentCommissionCell } from "@/components/ceo/agent-commission-cell";
import { CeoBusinessSection } from "@/components/ceo/business-section";
import { CeoKpiStrip } from "@/components/ceo/kpi-strip";
import { PlatformSettingsPanel } from "@/components/ceo/platform-settings-panel";
import { PaymentRowActions } from "@/components/ceo/payment-row-actions";
import { ReportRowActions } from "@/components/ceo/report-row-actions";
import { CeoCreateAgentButton } from "@/components/ceo/create-agent-modal";
import { CeoSectionNav } from "@/components/ceo/section-nav";
import { UrgentSaleDisableButton } from "@/components/ceo/urgent-sale-disable-button";
import { CeoUsersSection } from "@/components/ceo/users-section";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { CEO_API_OVERVIEW_PATH } from "@/lib/ceo-platform";
import { getCeoCommandCenterOverview } from "@/lib/ceo-queries";
import { getLocationTree } from "@/lib/location-queries";
import { getPlatformSettings } from "@/lib/platform-settings";

type SearchParams = Promise<{
  bq?: string;
  bstatus?: string;
  bpage?: string;
  uq?: string;
  urole?: string;
  upage?: string;
}>;

export default async function CeoCommandCenterPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [overview, platformSettings] = await Promise.all([getCeoCommandCenterOverview(), getPlatformSettings()]);
  const ceoLocationTree = overview.ok === true ? await getLocationTree().catch(() => []) : [];

  return (
    <main className="relative mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-4xl rounded-full bg-gradient-to-r from-violet-500/15 via-cyan-500/12 to-emerald-500/10 blur-3xl"
        aria-hidden
      />
      <DashboardPageHeader
        title="Pilotage plateforme"
        subtitle="Vue d'ensemble, validation des businesses, paiements Bizapay, agents et modération."
        statusBadge="CEO"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:border-cyan-300/35"
            >
              Vitrine
            </Link>
            <Link
              href={CEO_API_OVERVIEW_PATH}
              className="rounded-full border border-cyan-400/35 bg-gradient-to-r from-cyan-500/25 to-violet-500/20 px-4 py-2 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(6,182,212,0.15)] hover:from-cyan-500/35 hover:to-violet-500/30"
            >
              Export données
            </Link>
          </div>
        }
      />

      <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
        <Shield className="h-4 w-4 text-cyan-300/70" aria-hidden />
        <span>Chaque action sensible est enregistrée côté serveur.</span>
      </div>

      <div className="mt-6">
        <CeoSectionNav />
      </div>

      {!overview.ok ? (
        <DashboardGlassCard className="mt-6 border border-amber-400/30 bg-amber-500/10 p-5">
          <p className="font-semibold text-amber-100">Base de données indisponible ou erreur Prisma</p>
          <p className="mt-1 text-sm text-amber-200/80">{overview.error}</p>
          <p className="mt-3 text-xs text-white/60">
            Vérifiez DATABASE_URL / DIRECT_URL et la connectivité Supabase. Les sections détaillées sont désactivées
            jusqu’à rétablissement.
          </p>
        </DashboardGlassCard>
      ) : (
        <>
          <div className="mt-2" id="kpis">
            <CeoKpiStrip kpis={overview.kpis} />
          </div>

          <div className="mt-8 space-y-8">
            <CeoBusinessSection searchParams={sp} />

            <DashboardGlassCard className="p-0" id="payments">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-lg font-bold">Paiements Bizapay</h2>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-100">
                    En attente : {overview.paymentCounts.pending}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">
                    Approuvés : {overview.paymentCounts.approved}
                  </span>
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-100">
                    Rejetés : {overview.paymentCounts.rejected}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                    Expirés : {overview.paymentCounts.expired}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
                    <tr>
                      <th className="px-3 py-3">Réf.</th>
                      <th className="px-3 py-3">Plan</th>
                      <th className="px-3 py-3">Méthode</th>
                      <th className="px-3 py-3">Montant</th>
                      <th className="px-3 py-3">Statut</th>
                      <th className="px-3 py-3">Business</th>
                      <th className="px-3 py-3">Payeur</th>
                      <th className="px-3 py-3">Preuve</th>
                      <th className="px-3 py-3">Commentaire</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentPayments.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="px-3 py-3 font-mono text-xs">{p.reference}</td>
                        <td className="px-3 py-3 text-xs">{p.requestedPlan}</td>
                        <td className="px-3 py-3 text-xs">{p.paymentMethod}</td>
                        <td className="px-3 py-3">
                          {p.amount.toLocaleString("fr-FR")} {p.currency}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              p.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-100"
                                : p.status === "PENDING"
                                  ? "bg-amber-500/20 text-amber-100"
                                  : p.status === "REJECTED"
                                    ? "bg-red-500/20 text-red-100"
                                    : "bg-white/10 text-white/70",
                            ].join(" ")}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-white/80">{p.businessName}</td>
                        <td className="px-3 py-3 text-xs text-white/65">{p.userEmail}</td>
                        <td className="px-3 py-3 text-xs">
                          {p.proofImageUrl ? (
                            <a href={p.proofImageUrl} target="_blank" className="text-cyan-200 hover:underline">
                              Voir capture
                            </a>
                          ) : (
                            <span className="text-white/50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-white/65">{p.ceoComment || "—"}</td>
                        <td className="px-3 py-3 text-xs text-white/55">
                          {p.createdAt.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-3">
                          <PaymentRowActions paymentId={p.id} status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardGlassCard>

            <DashboardGlassCard className="p-0" id="agents">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Agents & performances</h2>
                  <p className="text-sm text-white/65">
                    Commissions, référés — retraits = commissions marquées payées
                  </p>
                </div>
                <CeoCreateAgentButton
                  locationTree={ceoLocationTree}
                  defaultCommissionRate={platformSettings.defaultAgentCommission}
                  disabled={ceoLocationTree.length === 0}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
                    <tr>
                      <th className="px-3 py-3">Agent</th>
                      <th className="px-3 py-3">Code</th>
                      <th className="px-3 py-3">Com. %</th>
                      <th className="px-3 py-3">Référés</th>
                      <th className="px-3 py-3">Business référés</th>
                      <th className="px-3 py-3">Comm. total</th>
                      <th className="px-3 py-3">Payé</th>
                      <th className="px-3 py-3">En attente</th>
                      <th className="px-3 py-3">Potentiel futur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.agents.map((a) => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="px-3 py-3">
                          <div className="text-white/90">{a.userEmail}</div>
                          {a.userName && <div className="text-xs text-white/45">{a.userName}</div>}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-cyan-200/90">{a.code}</td>
                        <td className="px-3 py-3 text-white/80">
                          <AgentCommissionCell agentId={a.id} initialRate={a.commissionRatePct} />
                        </td>
                        <td className="px-3 py-3">{a.totalRecruited}</td>
                        <td className="px-3 py-3">{a.referredBusinessesCount}</td>
                        <td className="px-3 py-3">{a.commissionsTotal.toLocaleString("fr-FR")} USD</td>
                        <td className="px-3 py-3 text-emerald-200/90">
                          {a.commissionsPaid.toLocaleString("fr-FR")} USD
                        </td>
                        <td className="px-3 py-3 text-amber-200/90">
                          {a.commissionsPending.toLocaleString("fr-FR")} USD
                        </td>
                        <td className="px-3 py-3 text-cyan-200/90">
                          {a.potentialFutureCommissions.toLocaleString("fr-FR")} USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {overview.agents.length === 0 && (
                  <p className="p-6 text-sm text-white/55">Aucun profil agent indexé.</p>
                )}
              </div>
            </DashboardGlassCard>

            <CeoUsersSection searchParams={sp} />

            <DashboardGlassCard className="p-0" id="moderation">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-lg font-bold">Modération</h2>
                <p className="text-sm text-white/65">
                  Signalements ouverts — businesses suspendus ou refusés :{" "}
                  <span className="font-semibold text-amber-200">{overview.blockedBusinesses}</span>
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Ventes en urgence actives :{" "}
                  <span className="font-semibold text-orange-200">{overview.kpis.activeUrgentSales}</span>
                </p>
              </div>
              <div className="border-b border-white/10 p-4">
                <h3 className="text-sm font-bold text-orange-100">Ventes en urgence</h3>
                <p className="mt-1 text-xs text-white/55">
                  Retrait du badge urgence et restauration du prix catalogue. Le produit reste en ligne.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
                      <tr>
                        <th className="px-3 py-3">Produit</th>
                        <th className="px-3 py-3">Business</th>
                        <th className="px-3 py-3">Prix</th>
                        <th className="px-3 py-3">Fin</th>
                        <th className="px-3 py-3">Raison</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.moderationUrgentSales.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                          <td className="px-3 py-3 text-white/90">{u.title}</td>
                          <td className="px-3 py-3">
                            <Link href={`/b/${u.businessSlug}`} className="text-cyan-200 hover:underline" target="_blank">
                              {u.businessName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-xs text-white/75">
                            <span className="text-white/45 line-through">{u.originalPrice.toLocaleString("fr-FR")}</span>{" "}
                            → <span className="font-semibold text-emerald-200">{u.urgentPrice.toLocaleString("fr-FR")}</span>{" "}
                            {u.currency}
                          </td>
                          <td className="px-3 py-3 text-xs text-white/55">{u.endsAt.toLocaleString("fr-FR")}</td>
                          <td className="max-w-[220px] truncate px-3 py-3 text-xs text-white/65">{u.reason ?? "—"}</td>
                          <td className="px-3 py-3">
                            <UrgentSaleDisableButton productId={u.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {overview.moderationUrgentSales.length === 0 && (
                    <p className="p-4 text-sm text-white/50">Aucune vente en urgence active.</p>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
                    <tr>
                      <th className="px-3 py-3">Business</th>
                      <th className="px-3 py-3">Motif</th>
                      <th className="px-3 py-3">Statut</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.reportsOpen.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="px-3 py-3">
                          <Link href={`/b/${r.businessSlug}`} className="text-cyan-200 hover:underline" target="_blank">
                            {r.businessName}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-white/80">{r.reason}</td>
                        <td className="px-3 py-3 text-xs">{r.status}</td>
                        <td className="px-3 py-3 text-xs text-white/55">{r.createdAt.toLocaleDateString("fr-FR")}</td>
                        <td className="px-3 py-3">
                          <ReportRowActions reportId={r.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {overview.reportsOpen.length === 0 && (
                  <p className="p-6 text-sm text-white/55">Aucun signalement ouvert.</p>
                )}
              </div>
            </DashboardGlassCard>

            <div id="platform-settings">
              <PlatformSettingsPanel initial={platformSettings} />
            </div>

            <div id="analytics">
            <CeoAnalyticsCharts
              signupsByDay={overview.analytics.signupsByDay}
              businessesByDay={overview.analytics.businessesByDay}
              viewsByDay={overview.analytics.viewsByDay}
              topCities={overview.analytics.topCities}
              topCategories={overview.analytics.topCategories}
            />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
