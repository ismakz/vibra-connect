import { Suspense } from "react";
import Link from "next/link";
import { MapPin, SlidersHorizontal, Sparkles } from "lucide-react";

import { ExploreMarketplaceFiltersForm } from "@/components/marketplace/explore-marketplace-filters-form";
import { ExploreResults } from "@/components/marketplace/explore-results";
import { ExploreSearchField } from "@/components/marketplace/explore-search-field";
import { getLocationTree } from "@/lib/location-queries";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getExplorerFilters } from "@/lib/queries";
import {
  type MarketplacePlanFilter,
  type MarketplaceSort,
  getMarketplaceBusinessesPage,
} from "@/lib/marketplace-queries";

type SearchParams = Promise<{
  q?: string;
  city?: string;
  category?: string;
  plan?: string;
  sponsored?: string;
  urgent?: string;
  sort?: string;
}>;

function parsePlan(v: string | undefined): MarketplacePlanFilter {
  const x = (v ?? "all").toLowerCase();
  if (x === "free" || x === "standard" || x === "premium" || x === "sponsored") return x;
  return "all";
}

function parseSort(v: string | undefined): MarketplaceSort {
  const x = (v ?? "recent").toLowerCase();
  if (x === "popular" || x === "views" || x === "premium") return x;
  return "recent";
}

export default async function ExploreMarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const plan = parsePlan(sp.plan);
  const sort = parseSort(sp.sort);
  const sponsoredOnly = sp.sponsored === "1";
  const urgentOnly = sp.urgent === "1";

  const [settings, { categories, databaseAvailable }, locationTree] = await Promise.all([
    getPlatformSettings(),
    getExplorerFilters(),
    getLocationTree().catch(() => []),
  ]);
  const data = settings.maintenanceMode
    ? { ok: false as const, error: "Marketplace en maintenance temporaire." }
    : await getMarketplaceBusinessesPage({
        q: sp.q,
        city: sp.city,
        category: sp.category,
        plan,
        sponsoredOnly,
        urgentOnly,
        sort,
        page: 1,
      });

  const queryBase: Record<string, string | undefined> = {
    ...(sp.q?.trim() ? { q: sp.q.trim() } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.category ? { category: sp.category } : {}),
    ...(plan !== "all" ? { plan } : {}),
    ...(sponsoredOnly ? { sponsored: "1" } : {}),
    ...(urgentOnly ? { urgent: "1" } : {}),
    ...(sort !== "recent" ? { sort } : {}),
  };

  const exploreStateKey = [sp.q ?? "", sp.city ?? "", sp.category ?? "", plan, sort, sponsoredOnly ? "1" : "", urgentOnly ? "1" : ""].join("|");

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">Bizaflow · VIBRA CONNECT</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Marketplace premium</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75 md:text-base">
              Découvrez des entreprises africaines vérifiées, sponsors Bizapay et profils enrichis — recherche temps réel et filtres
              avancés.
            </p>
          </div>
          <Link
            href="/tarifs"
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.2)] hover:bg-violet-500/25"
          >
            <Sparkles className="h-4 w-4" />
            Passer Premium
          </Link>
        </div>

        {!databaseAvailable && (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Base de données temporairement indisponible — filtres réduits. Réessayez sous peu.
          </p>
        )}
        {settings.maintenanceMode && (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Mode maintenance activé par le CEO. L’exploration est temporairement suspendue.
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_40px_rgba(6,182,212,0.06)]">
          <Suspense
            fallback={
              <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" aria-hidden />
            }
          >
            <ExploreSearchField key={exploreStateKey} initialQ={sp.q ?? ""} />
          </Suspense>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="glass h-fit rounded-2xl border border-white/10 p-4 lg:sticky lg:top-20">
            <div className="mb-3 hidden items-center gap-2 text-sm font-semibold text-cyan-200 lg:flex">
              <SlidersHorizontal className="h-4 w-4" /> Filtres marketplace
            </div>
            <ExploreMarketplaceFiltersForm
              key={exploreStateKey}
              initialQ={sp.q ?? ""}
              initialCitySlug={sp.city ?? ""}
              initialCategorySlug={sp.category ?? ""}
              plan={plan}
              sort={sort}
              sponsoredOnly={sponsoredOnly}
              urgentOnly={urgentOnly}
              categories={categories}
              locationTree={locationTree}
            />

            <p className="mt-4 flex items-start gap-2 text-xs text-white/45">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400/70" />
              Marketplace connectée à Bizaflow — paiements et abonnements via Bizapay.
            </p>
          </aside>

          <section className="min-w-0">
            {!data.ok ? (
              <article className="glass rounded-3xl border border-red-400/25 bg-red-500/10 p-8 text-center">
                <p className="font-semibold text-red-100">Exploration temporairement indisponible</p>
                <p className="mt-2 text-sm text-red-200/80">{data.error}</p>
              </article>
            ) : (
              <>
                <p className="mb-4 text-sm text-white/55">
                  <span className="font-semibold text-white/90">{data.total}</span> entreprise
                  {data.total > 1 ? "s" : ""} — page {data.page} / {data.totalPages}
                </p>
                <ExploreResults
                  key={exploreStateKey}
                  initialRows={data.rows}
                  initialPage={data.page}
                  totalPages={data.totalPages}
                  queryBase={queryBase}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
