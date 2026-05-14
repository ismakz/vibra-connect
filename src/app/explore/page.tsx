import { Suspense } from "react";
import Link from "next/link";
import { MapPin, SlidersHorizontal, Sparkles } from "lucide-react";

import { ExploreResults } from "@/components/marketplace/explore-results";
import { ExploreSearchField } from "@/components/marketplace/explore-search-field";
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

  const [settings, { cities, categories, databaseAvailable }] = await Promise.all([
    getPlatformSettings(),
    getExplorerFilters(),
  ]);
  const data = settings.maintenanceMode
    ? { ok: false as const, error: "Marketplace en maintenance temporaire." }
    : await getMarketplaceBusinessesPage({
        q: sp.q,
        city: sp.city,
        category: sp.category,
        plan,
        sponsoredOnly,
        sort,
        page: 1,
      });

  const queryBase: Record<string, string | undefined> = {
    ...(sp.q?.trim() ? { q: sp.q.trim() } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.category ? { category: sp.category } : {}),
    ...(plan !== "all" ? { plan } : {}),
    ...(sponsoredOnly ? { sponsored: "1" } : {}),
    ...(sort !== "recent" ? { sort } : {}),
  };

  const exploreStateKey = [sp.q ?? "", sp.city ?? "", sp.category ?? "", plan, sort, sponsoredOnly ? "1" : ""].join("|");

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
            href="/pricing"
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
            <form method="GET" action="/explore" className="space-y-3">
              <input type="hidden" name="q" value={sp.q ?? ""} />

              <div>
                <label className="mb-1 block text-xs font-medium text-white/55">Ville</label>
                <select
                  name="city"
                  defaultValue={sp.city ?? ""}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-sm focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="">Toutes les villes</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/55">Catégorie</label>
                <select
                  name="category"
                  defaultValue={sp.category ?? ""}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-sm focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/55">Abonnement</label>
                <select
                  name="plan"
                  defaultValue={plan}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-sm focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="all">Tous les plans</option>
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="sponsored">Sponsoring actif</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <input type="checkbox" name="sponsored" value="1" defaultChecked={sponsoredOnly} />
                Uniquement sponsorisés (Bizapay)
              </label>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/55">Tri</label>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-sm focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="recent">Plus récents</option>
                  <option value="popular">Populaires</option>
                  <option value="views">Plus vus</option>
                  <option value="premium">Premium / mise en avant</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(139,92,246,0.35)]"
                >
                  Appliquer
                </button>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm text-white/85 hover:border-cyan-400/30"
                >
                  Réinit.
                </Link>
              </div>
            </form>

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
