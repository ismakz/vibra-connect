import { prisma } from "@/lib/prisma";

export type LocationTreeCity = { id: string; name: string; slug: string };
export type LocationTreeTerritory = {
  id: string;
  name: string;
  slug: string;
  cities: LocationTreeCity[];
};
export type LocationTreeProvince = {
  id: string;
  name: string;
  slug: string;
  territories: LocationTreeTerritory[];
  /** Villes rattachées directement à la province (sans territoire). */
  cities: LocationTreeCity[];
};
export type LocationTreeCountry = {
  id: string;
  name: string;
  slug: string;
  provinces: LocationTreeProvince[];
};

export async function getLocationTree(): Promise<LocationTreeCountry[]> {
  const rows = await prisma.country.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      provinces: {
        orderBy: { name: "asc" },
        include: {
          territories: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            include: {
              cities: {
                where: { isActive: true },
                orderBy: { name: "asc" },
                select: { id: true, name: true, slug: true },
              },
            },
          },
          cities: {
            where: { isActive: true, territoryId: null },
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  return rows.map((country) => ({
    id: country.id,
    name: country.name,
    slug: country.slug,
    provinces: country.provinces.map((province) => ({
      id: province.id,
      name: province.name,
      slug: province.slug,
      territories: province.territories.map((territory) => ({
        id: territory.id,
        name: territory.name,
        slug: territory.slug,
        cities: territory.cities,
      })),
      cities: province.cities,
    })),
  }));
}

/** Résout une ville (id ou slug) vers pays / province / territoire pour affichage. */
export function resolveCityAnchor(
  tree: LocationTreeCountry[],
  value: string,
  valueMode: "id" | "slug",
): { countryId: string; provinceId: string; territoryId: string } | null {
  if (!value) return null;
  for (const country of tree) {
    for (const province of country.provinces) {
      for (const territory of province.territories) {
        const hit =
          valueMode === "id"
            ? territory.cities.find((city) => city.id === value)
            : territory.cities.find((city) => city.slug === value);
        if (hit) {
          return { countryId: country.id, provinceId: province.id, territoryId: territory.id };
        }
      }
      for (const city of province.cities) {
        const hit = valueMode === "id" ? city.id === value : city.slug === value;
        if (hit) {
          return { countryId: country.id, provinceId: province.id, territoryId: "" };
        }
      }
    }
  }
  return null;
}
