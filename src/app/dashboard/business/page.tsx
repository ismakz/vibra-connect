import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Phone, Sparkles, Store, TrendingUp } from "lucide-react";

import { BusinessActivityChart } from "@/components/dashboard/business-activity-chart";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { guardBusinessOwnerArea } from "@/lib/dashboard-business-access";
import { bucketCountsByDay } from "@/lib/dashboard-business-analytics";
import { prisma } from "@/lib/prisma";
import { formatMarketplacePlan, getBusinessSubscriptionUi, hasAdvancedAnalytics } from "@/lib/subscription-rules";

type DashboardBusiness = {
  id: string;
  name: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  subscriptionPlan: "FREE" | "STARTER" | "PRO" | "PREMIUM" | "SPONSORED";
  subscriptionStatus: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: Date | null;
  city: { name: string } | null;
  category: { name: string } | null;
  _count: {
    contactClickEvents: number;
    viewEvents: number;
    productServices: number;
  };
};

export default async function BusinessDashboardPage() {
  const session = await guardBusinessOwnerArea("/dashboard/business");

  let databaseAvailable = true;
  let business: DashboardBusiness | null = null;
  let activeProductsCount = 0;
  let whatsappClicks = 0;
  let callClicks = 0;
  let directionClicks = 0;
  let recentContacts: Array<{ id: string; type: string; source: string | null; createdAt: Date }> = [];
  let latestProducts: Array<{ id: string; title: string; description: string; isAvailable: boolean; createdAt: Date }> = [];
  let activePromotions: Array<{ id: string; title: string; description: string; expiresAt: Date | null }> = [];
  let activitySeries: Array<{ label: string; vues: number; clics: number }> = [];
  let conversionPct = 0;

  try {
    business = (await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      include: {
        city: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { contactClickEvents: true, viewEvents: true, productServices: true } },
      },
    })) as DashboardBusiness | null;

    if (business) {
      const now = new Date();
      let activityResult: { series: Array<{ label: string; vues: number; clics: number }>; conv: number };
      [
        activeProductsCount,
        whatsappClicks,
        callClicks,
        directionClicks,
        recentContacts,
        latestProducts,
        activePromotions,
        activityResult,
      ] = await Promise.all([
        prisma.productService.count({
          where: { businessId: business.id, status: "PUBLISHED", isAvailable: true },
        }),
        prisma.contactClickEvent.count({ where: { businessId: business.id, type: "WHATSAPP" } }),
        prisma.contactClickEvent.count({ where: { businessId: business.id, type: "CALL" } }),
        prisma.contactClickEvent.count({ where: { businessId: business.id, type: "DIRECTION" } }),
        prisma.contactClickEvent.findMany({
          where: { businessId: business.id },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, type: true, source: true, createdAt: true },
        }),
        prisma.productService.findMany({
          where: { businessId: business.id, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: { id: true, title: true, description: true, isAvailable: true, createdAt: true },
        }),
        prisma.promotion.findMany({
          where: {
            businessId: business.id,
            status: "PUBLISHED",
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: { id: true, title: true, description: true, expiresAt: true },
        }),
        (async () => {
          const since = new Date();
          since.setDate(since.getDate() - 14);
          const [viewsRaw, clicksRaw] = await Promise.all([
            prisma.businessViewEvent.findMany({
              where: { businessId: business.id, createdAt: { gte: since } },
              select: { createdAt: true },
              take: 5000,
              orderBy: { createdAt: "desc" },
            }),
            prisma.contactClickEvent.findMany({
              where: { businessId: business.id, createdAt: { gte: since } },
              select: { createdAt: true },
              take: 5000,
              orderBy: { createdAt: "desc" },
            }),
          ]);
          const vb = bucketCountsByDay(
            viewsRaw.map((v) => v.createdAt),
            14,
          );
          const cb = bucketCountsByDay(
            clicksRaw.map((c) => c.createdAt),
            14,
          );
          const series = vb.map((b, i) => ({
            label: b.label,
            vues: b.count,
            clics: cb[i]?.count ?? 0,
          }));
          const tv = viewsRaw.length;
          const tc = clicksRaw.length;
          const conv = tv > 0 ? Math.round((tc / tv) * 1000) / 10 : 0;
          return { series, conv };
        })(),
      ]);
      activitySeries = activityResult.series;
      conversionPct = activityResult.conv;
    }
  } catch {
    databaseAvailable = false;
  }

  if (databaseAvailable && !business) {
    redirect("/dashboard/business/create");
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Dashboard business"
        subtitle="Pilotez votre visibilité, vos contacts et vos offres depuis votre espace propriétaire."
        action={
          <>
            <Link href="/dashboard/business/edit" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:border-cyan-300/40 hover:text-cyan-200">
              Modifier mon business
            </Link>
            <Link href="/dashboard/business/products" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
              Ajouter un produit/service
            </Link>
            <Link href="/dashboard/business/promotions" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
              Créer une promotion
            </Link>
          </>
        }
      />

      {!databaseAvailable && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de donnees indisponible pour le moment. Affichage en mode vitrine.
        </div>
      )}

      {!databaseAvailable && (
        <DashboardEmptyState
          icon={<Store className="h-5 w-5 text-amber-200" />}
          title="Données business indisponibles"
          description="La base de données ne répond pas. Réessayez plus tard pour afficher votre tableau de bord."
        />
      )}

      {business && (
        <section className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <DashboardGlassCard className="p-4">
              <p className="text-xs text-white/65">Vues profil</p>
              <p className="mt-2 text-2xl font-black text-cyan-200">{business._count.viewEvents}</p>
            </DashboardGlassCard>
            <DashboardGlassCard className="p-4">
              <p className="text-xs text-white/65">Clics WhatsApp</p>
              <p className="mt-2 text-2xl font-black text-green-300">{whatsappClicks}</p>
            </DashboardGlassCard>
            <DashboardGlassCard className="p-4">
              <p className="text-xs text-white/65">Appels</p>
              <p className="mt-2 text-2xl font-black">{callClicks}</p>
            </DashboardGlassCard>
            <DashboardGlassCard className="p-4">
              <p className="text-xs text-white/65">Itinéraires</p>
              <p className="mt-2 text-2xl font-black">{directionClicks}</p>
            </DashboardGlassCard>
            <DashboardGlassCard className="p-4">
              <p className="text-xs text-white/65">Produits actifs</p>
              <p className="mt-2 text-2xl font-black text-violet-200">{activeProductsCount}</p>
            </DashboardGlassCard>
          </div>

          <DashboardGlassCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-bold">Analytics (14 jours)</h2>
                </div>
                {hasAdvancedAnalytics(business.subscriptionPlan) ? (
                  <p className="mt-1 text-sm text-white/65">
                    Vues profil vs. contacts (WhatsApp, appel, itinéraire…). Taux de conversion approximatif :{" "}
                    <span className="font-semibold text-cyan-200">{conversionPct}%</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-amber-200/90">
                    Analytics premium réservés aux plans Premium/Sponsorisé.
                  </p>
                )}
              </div>
              <Link href="/dashboard/business/stats" className="text-xs font-semibold text-cyan-200 hover:underline">
                Détails
              </Link>
            </div>
            <div className="mt-4">
              {hasAdvancedAnalytics(business.subscriptionPlan) ? (
                <BusinessActivityChart series={activitySeries} />
              ) : (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Passez sur un plan Premium ou Sponsorisé via Bizapay pour débloquer ce module.
                </div>
              )}
            </div>
          </DashboardGlassCard>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <DashboardGlassCard id="profil" className="p-5">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-bold">Profil business</h2>
                </div>
                <p className="mt-3 text-xl font-semibold">{business.name}</p>
                <p className="mt-1 text-sm text-white/75">
                  {business.category?.name ?? "Catégorie"} • {business.city?.name ?? "Ville"}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Statut publication: <span className="font-semibold text-cyan-200">{business.status}</span>
                </p>
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-bold">Derniers produits/services</h2>
                </div>
                {latestProducts.length > 0 ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {latestProducts.map((item) => (
                      <article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-white/70">{item.description}</p>
                        <p className="mt-2 text-xs text-cyan-200">{item.isAvailable ? "Disponible" : "Temporairement indisponible"}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="Aucun produit/service actif"
                    description="Commencez par publier votre première offre."
                    embedded
                  />
                )}
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-300" />
                  <h2 className="text-lg font-bold">Promotions actives</h2>
                </div>
                {activePromotions.length > 0 ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {activePromotions.map((promo) => (
                      <article key={promo.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="font-semibold">{promo.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-white/70">{promo.description}</p>
                        <p className="mt-2 text-xs text-violet-200">
                          {promo.expiresAt ? `Expire le ${promo.expiresAt.toLocaleDateString()}` : "Sans date d'expiration"}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="Aucune promotion active"
                    description="Créez une offre pour booster votre visibilité."
                    embedded
                  />
                )}
              </DashboardGlassCard>
            </div>

            <div className="space-y-5">
              <DashboardGlassCard className="p-5">
                <h2 className="text-lg font-bold">Abonnement Bizapay</h2>
                {(() => {
                  const sub = getBusinessSubscriptionUi(business);
                  return (
                    <>
                      <p className="mt-2 text-sm text-white/75">
                        Plan marketplace :{" "}
                        <span className="font-semibold text-cyan-200">{formatMarketplacePlan(business.subscriptionPlan)}</span>
                      </p>
                      <p className="text-sm text-white/75">
                        Statut : <span className="font-semibold">{business.subscriptionStatus}</span>
                        {business.expiresAt && (
                          <span className="text-white/55"> · fin {business.expiresAt.toLocaleDateString("fr-FR")}</span>
                        )}
                      </p>
                      {sub.upgradeRecommended && (
                        <Link
                          href="/dashboard/business/subscription"
                          className="mt-3 inline-flex rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-500/25"
                        >
                          Souscrire via Bizapay
                        </Link>
                      )}
                    </>
                  );
                })()}
                {business.status === "PENDING" && (
                  <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Votre business est en attente de validation CEO.
                  </p>
                )}
                {business.subscriptionStatus === "EXPIRED" && (
                  <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Abonnement expiré — visibilité marketplace réduite. Renouvelez via Bizapay.
                  </p>
                )}
                {business.subscriptionStatus === "ACTIVE" && (
                  <p className="mt-3 rounded-lg border border-green-400/30 bg-green-500/10 px-3 py-2 text-xs text-green-200">
                    Abonnement actif — profil éligible sur /explore.
                  </p>
                )}
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-bold">Contacts récents</h2>
                </div>
                {recentContacts.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {recentContacts.map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                        <p className="font-medium">
                          {item.type === "WHATSAPP"
                            ? "WhatsApp"
                            : item.type === "CALL"
                              ? "Appel"
                              : item.type === "DIRECTION"
                                ? "Itinéraire"
                                : item.type}
                        </p>
                        <p className="text-xs text-white/65">
                          Source: {item.source ?? "non précisée"} • {item.createdAt.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="Aucun contact récent"
                    description="Les prochaines interactions clients apparaîtront ici."
                    embedded
                  />
                )}
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-violet-200" />
                  <h2 className="text-lg font-bold">Actions rapides</h2>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <Link href="/dashboard/business/edit" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 hover:border-cyan-300/35">
                    Modifier mon business
                  </Link>
                  <Link href="/dashboard/business/products" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 hover:border-cyan-300/35">
                    Ajouter un produit/service
                  </Link>
                  <Link href="/dashboard/business/promotions" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 hover:border-violet-300/35">
                    Créer une promotion
                  </Link>
                  <Link href="/dashboard/business/stats" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 hover:border-cyan-300/35">
                    Voir les stats détaillées
                  </Link>
                  <Link href="/dashboard/business/subscription" className="rounded-xl border border-violet-300/25 bg-violet-500/10 px-3 py-2 hover:border-violet-300/45">
                    Paiements Bizapay
                  </Link>
                </div>
              </DashboardGlassCard>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
