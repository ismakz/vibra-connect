"use client";

import { useEffect, useMemo, useState } from "react";

import { selectForm } from "@/lib/select-classes";
import type { LocationTreeCountry } from "@/lib/location-queries";

type ValueMode = "slug" | "id";

/** Statut chargement client quand `tree` est vide côté serveur (optionnel pour UI parente). */
export type LocationTreeFetchStatus =
  | { phase: "loading" }
  | { phase: "ready"; countryCount: number }
  | { phase: "error"; message: string };

type Props = {
  tree?: LocationTreeCountry[];
  /** Valeur courante : slug ville ou id ville selon `valueMode`. */
  value: string;
  onChange: (value: string) => void;
  valueMode?: ValueMode;
  /** Champ caché pour formulaire HTML (ex. `city` ou `cityId`). */
  formFieldName?: string;
  /** Si true, le champ caché est `required` (validation navigateur sur soumission). */
  formFieldRequired?: boolean;
  /**
   * Verrouillage total (ex. mode vitrine sans DB). Ne pas utiliser `true` uniquement parce que
   * `tree` est vide au SSR : l’arbre peut être chargé via `/api/locations/tree` côté client.
   */
  disabled?: boolean;
  /** `stack` : labels + colonne. `inline` : 3 selects pour grille parente (Hero) — champ caché géré par le parent si besoin. */
  layout?: "stack" | "inline";
  selectClassName?: string;
  /** Appelé quand l’arbre serveur est vide et qu’un fetch client démarre / réussit / échoue. */
  onClientTreeStatus?: (s: LocationTreeFetchStatus) => void;
};

export function LocationCascadingSelects({
  tree: treeProp,
  value,
  onChange,
  valueMode = "slug",
  formFieldName,
  formFieldRequired,
  disabled = false,
  layout = "stack",
  selectClassName,
  onClientTreeStatus,
}: Props) {
  const [fetchedTree, setFetchedTree] = useState<LocationTreeCountry[]>([]);
  const [pickerCountryId, setPickerCountryId] = useState("");
  const [pickerProvinceId, setPickerProvinceId] = useState("");

  const serverTreeLen = treeProp?.length ?? 0;
  const countries = serverTreeLen > 0 ? (treeProp as LocationTreeCountry[]) : fetchedTree;

  const hardLock = Boolean(disabled);
  const noCountries = countries.length === 0;
  const countryDisabled = hardLock || noCountries;

  useEffect(() => {
    if (serverTreeLen > 0) {
      onClientTreeStatus?.({ phase: "ready", countryCount: serverTreeLen });
      return;
    }

    let cancelled = false;
    onClientTreeStatus?.({ phase: "loading" });

    (async () => {
      try {
        const res = await fetch("/api/locations/tree");
        const data = (await res.json()) as { countries?: LocationTreeCountry[]; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            typeof data?.error === "string" && data.error.length > 0
              ? data.error
              : `Erreur HTTP ${res.status}`;
          console.warn("[VIBRA] /api/locations/tree failed:", msg);
          onClientTreeStatus?.({ phase: "error", message: msg });
          return;
        }
        const list = Array.isArray(data.countries) ? data.countries : [];
        if (list.length > 0) {
          setFetchedTree(list);
          onClientTreeStatus?.({ phase: "ready", countryCount: list.length });
        } else {
          console.warn("[VIBRA] /api/locations/tree returned empty countries[]");
          onClientTreeStatus?.({ phase: "error", message: "Aucune localisation en base. Exécutez npm run prisma:seed." });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur réseau";
        console.warn("[VIBRA] /api/locations/tree", e);
        onClientTreeStatus?.({ phase: "error", message: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverTreeLen, onClientTreeStatus]);

  let anchored: { countryId: string; provinceId: string } | null = null;
  if (value && countries.length > 0) {
    for (const c of countries) {
      for (const p of c.provinces) {
        const hit =
          valueMode === "id"
            ? p.cities.find((city) => city.id === value)
            : p.cities.find((city) => city.slug === value);
        if (hit) {
          anchored = { countryId: c.id, provinceId: p.id };
          break;
        }
      }
      if (anchored) break;
    }
  }

  const effectiveCountryId = anchored?.countryId ?? pickerCountryId;
  const effectiveProvinceId = anchored?.provinceId ?? pickerProvinceId;

  const provinceDisabled = hardLock || noCountries || !effectiveCountryId;
  const cityDisabled = hardLock || noCountries || !effectiveProvinceId;

  const provinces = useMemo(() => {
    if (!effectiveCountryId) return [];
    return countries.find((c) => c.id === effectiveCountryId)?.provinces ?? [];
  }, [countries, effectiveCountryId]);

  const cities = useMemo(() => {
    if (!effectiveProvinceId) return [];
    return provinces.find((p) => p.id === effectiveProvinceId)?.cities ?? [];
  }, [provinces, effectiveProvinceId]);

  const selectValue =
    valueMode === "id"
      ? cities.some((c) => c.id === value)
        ? value
        : ""
      : cities.some((c) => c.slug === value)
        ? value
        : "";

  const selClass = selectClassName ?? selectForm;

  const countrySelect = (
    <select
      className={selClass}
      disabled={countryDisabled}
      value={effectiveCountryId}
      aria-label="Pays"
      onChange={(e) => {
        setPickerCountryId(e.target.value);
        setPickerProvinceId("");
        onChange("");
      }}
    >
      <option value="">Pays</option>
      {countries.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );

  const provinceSelect = (
    <select
      className={selClass}
      disabled={provinceDisabled}
      value={effectiveProvinceId}
      aria-label="Province / Région"
      onChange={(e) => {
        setPickerProvinceId(e.target.value);
        onChange("");
      }}
    >
      <option value="">Province / Région</option>
      {provinces.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );

  const citySelect = (
    <select
      className={selClass}
      disabled={cityDisabled}
      value={selectValue}
      aria-label="Ville"
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Ville</option>
      {cities.map((c) => (
        <option key={c.id} value={valueMode === "id" ? c.id : c.slug}>
          {c.name}
        </option>
      ))}
    </select>
  );

  if (layout === "inline") {
    return (
      <div className="contents">
        {countrySelect}
        {provinceSelect}
        {citySelect}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {formFieldName ? (
        <input type="hidden" name={formFieldName} value={value} readOnly required={formFieldRequired} />
      ) : null}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Pays</label>
        {countrySelect}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Province / Région</label>
        {provinceSelect}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Ville</label>
        {citySelect}
      </div>
    </div>
  );
}
