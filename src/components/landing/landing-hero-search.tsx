"use client";

import { useCallback, useMemo, useState } from "react";

import {
  LocationCascadingSelects,
  type LocationTreeFetchStatus,
} from "@/components/location/location-cascading-selects";
import type { LocationTreeCountry } from "@/lib/location-queries";
import { EXPLORE_MARKET_HREF } from "@/lib/nav-user";
import { selectHeroInline } from "@/lib/select-classes";

/** Hauteur commune champs + bouton (56px, min 52px) */
const heroCtrl =
  "box-border h-14 min-h-[52px] max-h-14 w-full rounded-lg border border-white/12 bg-[#070d1a]/92 px-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-sm transition placeholder:text-slate-400 focus:border-cyan-400/45 focus:ring-1 focus:ring-cyan-400/20";

function initialClientStatus(tree: LocationTreeCountry[]): LocationTreeFetchStatus {
  return tree.length > 0 ? { phase: "ready", countryCount: tree.length } : { phase: "loading" };
}

export function LandingHeroSearch({ locationTree }: { locationTree: LocationTreeCountry[] }) {
  const [citySlug, setCitySlug] = useState("");
  const [clientStatus, setClientStatus] = useState<LocationTreeFetchStatus>(() => initialClientStatus(locationTree));

  const onClientTreeStatus = useCallback((s: LocationTreeFetchStatus) => {
    setClientStatus(s);
  }, []);

  const displayStatus = useMemo((): LocationTreeFetchStatus => {
    if (locationTree.length > 0) {
      return { phase: "ready", countryCount: locationTree.length };
    }
    return clientStatus;
  }, [locationTree.length, clientStatus]);

  return (
    <form action={EXPLORE_MARKET_HREF} method="get" className="w-full">
      <input type="hidden" name="city" value={citySlug} readOnly />
      {displayStatus.phase === "loading" ? (
        <p className="mb-1.5 text-xs text-white/50" aria-live="polite">
          Chargement des localisations…
        </p>
      ) : null}
      {displayStatus.phase === "error" ? (
        <p className="mb-1.5 text-xs text-amber-200/90" role="alert">
          {displayStatus.message}
        </p>
      ) : null}
      <div
        role="search"
        className="rounded-xl border border-white/10 bg-white/[0.035] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.28)] backdrop-blur-md ring-1 ring-white/[0.04] sm:p-2"
      >
        <div className="grid grid-cols-1 gap-1.5 sm:gap-2 lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,0.65fr))_auto] lg:items-center">
          <input
            type="search"
            name="q"
            placeholder="Produit, service ou business"
            className={heroCtrl}
            autoComplete="off"
          />
          <LocationCascadingSelects
            tree={locationTree}
            value={citySlug}
            onChange={setCitySlug}
            valueMode="slug"
            layout="inline"
            selectClassName={selectHeroInline}
            onClientTreeStatus={onClientTreeStatus}
          />
          <button
            type="submit"
            className="inline-flex h-14 min-h-[52px] max-h-14 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-sm font-semibold text-black shadow-sm transition hover:from-violet-500 hover:to-cyan-400 sm:px-5 lg:w-auto lg:min-w-0"
          >
            Explorer le marché
          </button>
        </div>
      </div>
    </form>
  );
}
