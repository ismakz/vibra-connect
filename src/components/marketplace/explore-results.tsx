"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { MarketplaceBusinessRow } from "@/lib/marketplace-queries";

import { MarketplaceBusinessCard } from "./marketplace-business-card";

type PagePayload = {
  ok: true;
  rows: MarketplaceBusinessRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildQueryString(base: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  return p.toString();
}

export function ExploreResults({
  initialRows,
  initialPage,
  totalPages,
  queryBase,
}: {
  initialRows: MarketplaceBusinessRow[];
  initialPage: number;
  totalPages: number;
  queryBase: Record<string, string | undefined>;
}) {
  const [rows, setRows] = useState<MarketplaceBusinessRow[]>(initialRows);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    if (!hasMore || pending) return;
    const next = page + 1;
    const qs = buildQueryString({ ...queryBase, page: String(next) });
    start(async () => {
      try {
        const res = await fetch(`/api/explore/businesses?${qs}`);
        const data = (await res.json()) as PagePayload | { ok: false; error: string };
        if (!data || typeof data !== "object" || !("ok" in data) || data.ok !== true) {
          setError("Impossible de charger la suite des résultats.");
          return;
        }
        setRows((prev) => [...prev, ...data.rows]);
        setPage(data.page);
        setHasMore(data.page < data.totalPages);
      } catch {
        setError("Réseau indisponible. Réessayez dans un instant.");
      }
    });
  }, [hasMore, pending, page, queryBase]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-6">
      {rows.length === 0 ? (
        <article className="glass rounded-3xl border border-white/10 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-white">Aucun résultat pour ces critères</p>
          <p className="mt-2 max-w-md mx-auto text-sm text-white/65">
            Élargissez la recherche, changez de ville ou de catégorie — la marketplace VIBRA CONNECT couvre tout l’écosystème
            Bizaflow.
          </p>
        </article>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <MarketplaceBusinessCard key={b.id} business={b} serialized />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>
      )}

      {hasMore && rows.length > 0 && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {pending ? (
            <div className="flex gap-2 text-sm text-white/55">
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:240ms]" />
            </div>
          ) : (
            <button
              type="button"
              onClick={loadMore}
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white/90 hover:border-cyan-400/35"
            >
              Charger plus
            </button>
          )}
        </div>
      )}
    </div>
  );
}
