import { prisma } from "@/lib/prisma";

export type LocationTreeCity = { id: string; name: string; slug: string };
export type LocationTreeProvince = {
  id: string;
  name: string;
  slug: string;
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
          cities: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });
  return rows as LocationTreeCountry[];
}
