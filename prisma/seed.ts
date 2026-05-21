import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { DEFAULT_CATEGORY_NAMES } from "../src/lib/category-catalog";
import { slugify } from "../src/lib/slug";
import { LOCATION_TREE_DATA, type SeedProvince } from "./location-tree-data";

const prisma = new PrismaClient();

/** Compte CEO Bizaflow — mot de passe réservé au dev, à changer en production. */
const CEO_EMAIL = "ceo@bizaflow.app";
const CEO_PASSWORD_DEV = "Admin@2026";
const CEO_NAME = "Bizaflow CEO";

const categories = [...DEFAULT_CATEGORY_NAMES];

function normalizeProvinceTerritories(p: SeedProvince) {
  if (p.territories && p.territories.length > 0) return p.territories;
  if (p.cities && p.cities.length > 0) {
    return [{ name: "Localités", slug: `${p.slug}-local`, cities: p.cities }];
  }
  return [];
}

async function syncLocationHierarchy() {
  for (const c of LOCATION_TREE_DATA) {
    const country = await prisma.country.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      create: { name: c.name, slug: c.slug, sortOrder: c.sortOrder, isActive: true },
    });

    for (const p of c.provinces) {
      const province = await prisma.province.upsert({
        where: { countryId_slug: { countryId: country.id, slug: p.slug } },
        update: { name: p.name },
        create: { countryId: country.id, name: p.name, slug: p.slug },
      });

      const territories = normalizeProvinceTerritories(p);

      for (const t of territories) {
        const territory = await prisma.territory.upsert({
          where: { provinceId_slug: { provinceId: province.id, slug: t.slug } },
          update: { name: t.name, isActive: true },
          create: { provinceId: province.id, name: t.name, slug: t.slug, isActive: true },
        });

        for (const city of t.cities) {
          await prisma.city.upsert({
            where: { slug: city.slug },
            update: {
              name: city.name,
              provinceId: province.id,
              territoryId: territory.id,
              isActive: true,
            },
            create: {
              name: city.name,
              slug: city.slug,
              provinceId: province.id,
              territoryId: territory.id,
              isActive: true,
            },
          });
        }
      }
    }
  }

  const rdc = await prisma.country.findUnique({ where: { slug: "rdc" } });
  if (rdc) {
    const legacy = await prisma.province.upsert({
      where: { countryId_slug: { countryId: rdc.id, slug: "hors-liste" } },
      update: {},
      create: { countryId: rdc.id, name: "Autres (migration)", slug: "hors-liste" },
    });
    const legacyTerritory = await prisma.territory.upsert({
      where: { provinceId_slug: { provinceId: legacy.id, slug: "hors-liste" } },
      update: { isActive: true },
      create: { provinceId: legacy.id, name: "Hors liste", slug: "hors-liste", isActive: true },
    });
    await prisma.city.updateMany({
      where: { provinceId: null },
      data: { provinceId: legacy.id, territoryId: legacyTerritory.id },
    });
    await prisma.city.updateMany({
      where: { provinceId: legacy.id, territoryId: null },
      data: { territoryId: legacyTerritory.id },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(CEO_PASSWORD_DEV, 12);

  await prisma.user.upsert({
    where: { email: CEO_EMAIL },
    update: {
      name: CEO_NAME,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: CEO_EMAIL,
      name: CEO_NAME,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.platformSettings.upsert({
    where: { singletonKey: "MARKETPLACE" },
    update: {
      isActive: true,
      mtnMomoRwandaNumber: "+250786533333",
      mtnMomoRwandaCountry: "Rwanda",
      mtnMomoRwandaCurrency: "RWF",
      mtnMomoRwandaEnabled: true,
      airtelMoneyRdcNumber: "+243997409912",
      airtelMoneyRdcCountry: "RDC",
      airtelMoneyRdcCurrency: "USD/CDF",
      airtelMoneyRdcEnabled: true,
    },
    create: {
      singletonKey: "MARKETPLACE",
      isActive: true,
      defaultAgentCommission: 5,
      freePlanPrice: 0,
      standardPlanPrice: 29,
      premiumPlanPrice: 79,
      sponsoredPlanPrice: 149,
      maxProductsFree: 3,
      maxProductsStandard: 15,
      maxProductsPremium: 120,
      maxGalleryImages: 8,
      sponsoredBoostLevel: 1,
      maintenanceMode: false,
      mtnMomoRwandaNumber: "+250786533333",
      mtnMomoRwandaCountry: "Rwanda",
      mtnMomoRwandaCurrency: "RWF",
      mtnMomoRwandaEnabled: true,
      airtelMoneyRdcNumber: "+243997409912",
      airtelMoneyRdcCountry: "RDC",
      airtelMoneyRdcCurrency: "USD/CDF",
      airtelMoneyRdcEnabled: true,
    },
  });

  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  await syncLocationHierarchy();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
