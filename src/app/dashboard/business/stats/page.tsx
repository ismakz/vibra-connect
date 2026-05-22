import Link from "next/link";
import { BarChart3, LineChart, MessageCircle, PhoneCall, Share2, TrendingUp } from "lucide-react";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { BusinessDashboardNav } from "@/components/dashboard/business-dashboard-nav";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { guardBusinessOwnerArea } from "@/lib/dashboard-business-access";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  status?: "7d" | "30d" | "90d" | "all";
}>;

type DailyPoint = {
  day: string;
  views: number;
  contacts: number;
};

function formatDay(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default async function BusinessStatsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await guardBusinessOwnerArea();

  const params = await searchParams;
  const range = params.status ?? "30d";
  const q = params.q?.trim() ?? "";

  const now = new Date();
  const rangeStart =
    range === "7d"
      ? new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
      : range === "30d"
        ? new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)
        : range === "90d"
          ? new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90)
          : null;

  let databaseAvailable = true;
  let hasData = false;
  let business: { id: string; name: string } | null = null;
  let viewsProfile = 0;
  let whatsappClicks = 0;
  let callClicks = 0;
  let directionClicks = 0;
  let shareClicks = 0;
  let contactsByChannel: Array<{ label: string; value: number }> = [];
  let evolution: DailyPoint[] = [];
  let topConsultedProducts: Array<{ label: string; count: number }> = [];
  let suggestions: string[] = [];
  let eventCount = 0;

  try {
    business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });

    if (business) {
      const viewsWhere = {
        businessId: business.id,
        ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
      };
      const contactsWhere = {
        businessId: business.id,
        ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
        ...(q ? { source: { contains: q, mode: "insensitive" as const } } : {}),
      };

      const [viewEvents, contactEvents] = await Promise.all([
        prisma.businessViewEvent.findMany({
          where: viewsWhere,
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.contactClickEvent.findMany({
          where: contactsWhere,
          select: { createdAt: true, type: true, source: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      viewsProfile = viewEvents.length;
      whatsappClicks = contactEvents.filter((e) => e.type === "WHATSAPP").length;
      callClicks = contactEvents.filter((e) => e.type === "CALL").length;
      directionClicks = contactEvents.filter((e) => e.type === "DIRECTION").length;
      shareClicks = contactEvents.filter((e) => e.type === "SHARE").length;
      eventCount = viewEvents.length + contactEvents.length;
      hasData = eventCount > 0;

      contactsByChannel = [
        { label: "WhatsApp", value: whatsappClicks },
        { label: "Appels", value: callClicks },
        { label: "Itinéraires", value: directionClicks },
        { label: "Partages", value: shareClicks },
      ];

      const byDay = new Map<string, DailyPoint>();
      for (const e of viewEvents) {
        const key = formatDay(e.createdAt);
        const current = byDay.get(key) ?? { day: key, views: 0, contacts: 0 };
        current.views += 1;
        byDay.set(key, current);
      }
      for (const e of contactEvents) {
        const key = formatDay(e.createdAt);
        const current = byDay.get(key) ?? { day: key, views: 0, contacts: 0 };
        current.contacts += 1;
        byDay.set(key, current);
      }
      evolution = Array.from(byDay.values()).slice(-10);

      const sourceBuckets = new Map<string, number>();
      for (const event of contactEvents) {
        if (!event.source) continue;
        const source = event.source.trim();
        if (!source || source === "profile") continue;
        sourceBuckets.set(source, (sourceBuckets.get(source) ?? 0) + 1);
      }
      topConsultedProducts = Array.from(sourceBuckets.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (viewsProfile < 50) suggestions.push("Augmenter la visibilité du profil avec une bannière et des promotions actives.");
      if (whatsappClicks < Math.max(3, Math.floor(viewsProfile * 0.1))) {
        suggestions.push("Ajouter des offres plus claires pour améliorer la conversion vers WhatsApp.");
      }
      if (callClicks === 0 && directionClicks === 0) {
        suggestions.push("Compléter le numéro de téléphone et l'adresse pour générer plus d'appels et d'itinéraires.");
      }
      if (topConsultedProducts.length === 0) {
        suggestions.push("Taguer les sources de campagnes pour identifier les produits les plus consultés.");
      }
      if (suggestions.length === 0) suggestions.push("Les performances sont stables. Continuez à publier régulièrement.");
    }
  } catch {
    databaseAvailable = false;
    business = { id: "fallback", name: "Business local VIBRA CONNECT" };
    viewsProfile = 126;
    whatsappClicks = 34;
    callClicks = 12;
    directionClicks = 9;
    shareClicks = 5;
    contactsByChannel = [
      { label: "WhatsApp", value: whatsappClicks },
      { label: "Appels", value: callClicks },
      { label: "Itinéraires", value: directionClicks },
      { label: "Partages", value: shareClicks },
    ];
    evolution = [
      { day: "01/05", views: 10, contacts: 3 },
      { day: "02/05", views: 12, contacts: 4 },
      { day: "03/05", views: 16, contacts: 6 },
      { day: "04/05", views: 13, contacts: 5 },
      { day: "05/05", views: 18, contacts: 7 },
      { day: "06/05", views: 17, contacts: 6 },
    ];
    topConsultedProducts = [
      { label: "Service express premium", count: 9 },
      { label: "Pack accompagnement business", count: 6 },
    ];
    suggestions = [
      "Publier une nouvelle promotion cette semaine pour augmenter les vues.",
      "Ajouter un CTA WhatsApp plus visible sur vos offres clés.",
    ];
    hasData = true;
    eventCount = 1;
  }

  const maxEvolution = Math.max(1, ...evolution.map((d) => Math.max(d.views, d.contacts)));
  const maxChannel = Math.max(1, ...contactsByChannel.map((c) => c.value));

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Statistiques business"
        subtitle="Suivez vos performances et identifiez rapidement les actions prioritaires."
        statusBadge={business ? `Business: ${business.name}` : undefined}
        action={
          <Link href="/dashboard/business/products" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
            Ajouter une offre
          </Link>
        }
      />

      <BusinessDashboardNav />

      {!databaseAvailable && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de données indisponible. Affichage d&apos;un aperçu vitrine.
        </div>
      )}

      <DashboardFilterBar
        query={q}
        queryPlaceholder="Filtrer par source (optionnel)"
        status={range}
        options={[
          { value: "7d", label: "7 jours" },
          { value: "30d", label: "30 jours" },
          { value: "90d", label: "90 jours" },
          { value: "all", label: "Tout" },
        ]}
        resultsCount={eventCount}
      />

      {!hasData ? (
        <DashboardEmptyState
          icon={<BarChart3 className="h-5 w-5 text-cyan-200" />}
          title="Aucune donnée statistique pour le moment"
          description="Les vues et interactions apparaîtront ici dès les premiers contacts clients."
          action={
            <Link href="/dashboard/business/products" className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-cyan-400">
              Publier une offre
            </Link>
          }
        />
      ) : (
        <section className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <DashboardGlassCard className="p-4">
              <p className="text-xs text-white/65">Vues profil</p>
              <p className="mt-2 text-2xl font-black text-cyan-200">{viewsProfile}</p>
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
              <p className="text-xs text-white/65">Partages</p>
              <p className="mt-2 text-2xl font-black text-violet-200">{shareClicks}</p>
            </DashboardGlassCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-bold">Contacts par canal</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {contactsByChannel.map((channel) => (
                    <div key={channel.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{channel.label}</span>
                        <span className="font-semibold text-cyan-200">{channel.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${(channel.value / maxChannel) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-violet-300" />
                  <h2 className="text-lg font-bold">Évolution récente</h2>
                </div>
                <div className="mt-4 grid gap-2">
                  {evolution.length > 0 ? (
                    evolution.map((point) => (
                      <div key={point.day} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="mb-2 flex items-center justify-between text-xs text-white/75">
                          <span>{point.day}</span>
                          <span>Vues {point.views} • Contacts {point.contacts}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(point.views / maxEvolution) * 100}%` }} />
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-violet-400" style={{ width: `${(point.contacts / maxEvolution) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <DashboardEmptyState embedded title="Pas encore d'évolution" description="Les séries temporelles apparaîtront après les premiers événements." />
                  )}
                </div>
              </DashboardGlassCard>
            </div>

            <div className="space-y-5">
              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-lg font-bold">Produits les plus consultés</h2>
                </div>
                {topConsultedProducts.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {topConsultedProducts.map((item) => (
                      <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                        <p className="font-medium line-clamp-1">{item.label}</p>
                        <p className="text-xs text-cyan-200">{item.count} interactions</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState embedded title="Donnée non disponible" description="Aucun produit lié détecté dans les sources d'interaction." />
                )}
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-green-300" />
                  <h2 className="text-lg font-bold">Ce qu&apos;il faut améliorer</h2>
                </div>
                <div className="mt-3 space-y-2">
                  {suggestions.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Link href="/dashboard/business/products" className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-center hover:border-cyan-300/35">
                    Gérer offres
                  </Link>
                  <Link href="/dashboard/business/promotions" className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-center hover:border-violet-300/35">
                    Gérer promotions
                  </Link>
                </div>
              </DashboardGlassCard>

              <DashboardGlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-violet-200" />
                  <h2 className="text-lg font-bold">Résumé performance</h2>
                </div>
                <p className="mt-2 text-sm text-white/75">
                  Vous avez généré <span className="font-semibold text-cyan-200">{viewsProfile}</span> vues et{" "}
                  <span className="font-semibold text-violet-200">{whatsappClicks + callClicks + directionClicks + shareClicks}</span> interactions
                  sur la période sélectionnée.
                </p>
              </DashboardGlassCard>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
