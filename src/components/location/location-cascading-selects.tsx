"use client";

import { useEffect, useMemo, useState } from "react";

import { resolveCityAnchor, type LocationTreeCountry } from "@/lib/location-queries";
import { selectForm } from "@/lib/select-classes";

type ValueMode = "slug" | "id";

export type LocationTreeFetchStatus =
  | { phase: "loading" }
  | { phase: "ready"; countryCount: number }
  | { phase: "error"; message: string };

type Props = {
  tree?: LocationTreeCountry[];
  value: string;
  onChange: (value: string) => void;
  valueMode?: ValueMode;
  formFieldName?: string;
  formFieldRequired?: boolean;
  disabled?: boolean;
  layout?: "stack" | "inline";
  selectClassName?: string;
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
  const [pickerTerritoryId, setPickerTerritoryId] = useState("");

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
          onClientTreeStatus?.({ phase: "error", message: msg });
          return;
        }
        const list = Array.isArray(data.countries) ? data.countries : [];
        if (list.length > 0) {
          setFetchedTree(list);
          onClientTreeStatus?.({ phase: "ready", countryCount: list.length });
        } else {
          onClientTreeStatus?.({ phase: "error", message: "Aucune localisation en base. Exécutez npm run prisma:seed." });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur réseau";
        onClientTreeStatus?.({ phase: "error", message: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverTreeLen, onClientTreeStatus]);

  const anchored = value && countries.length > 0 ? resolveCityAnchor(countries, value, valueMode) : null;

  const effectiveCountryId = anchored?.countryId ?? pickerCountryId;
  const effectiveProvinceId = anchored?.provinceId ?? pickerProvinceId;
  const effectiveTerritoryId =
    anchored?.territoryId !== undefined && anchored.territoryId !== ""
      ? anchored.territoryId
      : pickerTerritoryId;

  const provinces = useMemo(() => {
    if (!effectiveCountryId) return [];
    return countries.find((c) => c.id === effectiveCountryId)?.provinces ?? [];
  }, [countries, effectiveCountryId]);

  const selectedProvince = useMemo(() => {
    if (!effectiveProvinceId) return null;
    return provinces.find((p) => p.id === effectiveProvinceId) ?? null;
  }, [provinces, effectiveProvinceId]);

  const territories = useMemo(
    () => selectedProvince?.territories ?? [],
    [selectedProvince],
  );
  const directCities = useMemo(() => selectedProvince?.cities ?? [], [selectedProvince]);

  const provinceHasTerritories = territories.length > 0;

  const cities = useMemo(() => {
    if (!selectedProvince) return [];
    if (provinceHasTerritories) {
      if (!effectiveTerritoryId) return [];
      return territories.find((t) => t.id === effectiveTerritoryId)?.cities ?? [];
    }
    return directCities;
  }, [selectedProvince, provinceHasTerritories, effectiveTerritoryId, territories, directCities]);

  const provinceDisabled = hardLock || noCountries || !effectiveCountryId;
  const territoryDisabled = hardLock || noCountries || !effectiveProvinceId || !provinceHasTerritories;
  const cityDisabled =
    hardLock ||
    noCountries ||
    !effectiveProvinceId ||
    (provinceHasTerritories ? !effectiveTerritoryId : directCities.length === 0);

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
        setPickerTerritoryId("");
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
        setPickerTerritoryId("");
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

  const territorySelect = (
    <select
      className={selClass}
      disabled={territoryDisabled}
      value={provinceHasTerritories ? effectiveTerritoryId : ""}
      aria-label="Territoire / Zone rurale"
      onChange={(e) => {
        setPickerTerritoryId(e.target.value);
        onChange("");
      }}
    >
      <option value="">Territoire / Zone rurale</option>
      {territories.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );

  const citySelect = (
    <select
      className={selClass}
      disabled={cityDisabled}
      value={selectValue}
      aria-label="Ville / Commune"
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Ville / Commune</option>
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
        {territorySelect}
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
        <label className="mb-1 block text-xs font-medium text-white/55">Territoire / Zone rurale</label>
        {territorySelect}
        {!provinceHasTerritories && effectiveProvinceId ? (
          <p className="mt-1 text-[10px] text-white/45">Pas de territoire pour cette province — choisissez la ville.</p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-white/55">Ville / Commune</label>
        {citySelect}
      </div>
    </div>
  );
}
