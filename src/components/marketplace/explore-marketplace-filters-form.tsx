"use client";

import Link from "next/link";
import { useState } from "react";

import { LocationCascadingSelects } from "@/components/location/location-cascading-selects";
import type { LocationTreeCountry } from "@/lib/location-queries";
import { selectFilter } from "@/lib/select-classes";

import type { MarketplacePlanFilter, MarketplaceSort } from "@/lib/marketplace-queries";

type Cat = { id: string; name: string; slug: string };

export function ExploreMarketplaceFiltersForm({
  initialQ,
  initialCitySlug,
  initialCategorySlug,
  plan,
  sort,
  sponsoredOnly,
  urgentOnly,
  categories,
  locationTree,
}: {
  initialQ: string;
  initialCitySlug: string;
  initialCategorySlug: string;
  plan: MarketplacePlanFilter;
  sort: MarketplaceSort;
  sponsoredOnly: boolean;
  urgentOnly: boolean;
  categories: Cat[];
  locationTree: LocationTreeCountry[];
}) {
  const [citySlug, setCitySlug] = useState(initialCitySlug);

  return (
    <form method="GET" action="/explore" className="space-y-3">
      <input type="hidden" name="q" value={initialQ} />

      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Localisation</label>
        <LocationCascadingSelects
          tree={locationTree}
          value={citySlug}
          onChange={setCitySlug}
          valueMode="slug"
          formFieldName="city"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Catégorie</label>
        <select name="category" defaultValue={initialCategorySlug} className={selectFilter}>
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
        <select name="plan" defaultValue={plan} className={selectFilter}>
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

      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-orange-400/25 bg-orange-500/10 px-3 py-2 text-sm text-orange-50/95">
        <input type="checkbox" name="urgent" value="1" defaultChecked={urgentOnly} />
        Vente en urgence
      </label>

      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Tri</label>
        <select name="sort" defaultValue={sort} className={selectFilter}>
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
  );
}
