import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { DEFAULT_CATEGORY_NAMES } from "../src/lib/category-catalog";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

/** Compte CEO Bizaflow — mot de passe réservé au dev, à changer en production. */
const CEO_EMAIL = "ceo@bizaflow.app";
const CEO_PASSWORD_DEV = "Admin@2026";
const CEO_NAME = "Bizaflow CEO";

const categories = [...DEFAULT_CATEGORY_NAMES];

const cities = [
  "Kinshasa",
  "Goma",
  "Bukavu",
  "Lubumbashi",
  "Kisangani",
  "Matadi",
  "Kolwezi",
  "Kigali",
  "Gisenyi",
  "Kampala",
  "Bujumbura",
];

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

  for (const name of cities) {
    await prisma.city.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
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
