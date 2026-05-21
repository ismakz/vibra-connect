"use client";

import { useState } from "react";

import { LocationCascadingSelects } from "@/components/location/location-cascading-selects";
import type { LocationTreeCountry } from "@/lib/location-queries";

export function BusinessCreateLocationPick({ locationTree, disabled }: { locationTree: LocationTreeCountry[]; disabled?: boolean }) {
  const [cityId, setCityId] = useState("");
  return (
    <LocationCascadingSelects
      tree={locationTree}
      value={cityId}
      onChange={setCityId}
      valueMode="id"
      formFieldName="cityId"
      formFieldRequired
      disabled={Boolean(disabled)}
    />
  );
}
