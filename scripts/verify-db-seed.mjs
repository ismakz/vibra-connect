import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [countries, provinces, territories, cities, categories, settings, ceo] = await Promise.all([
    prisma.country.count(),
    prisma.province.count(),
    prisma.territory.count(),
    prisma.city.count(),
    prisma.category.count(),
    prisma.platformSettings.findUnique({ where: { singletonKey: "MARKETPLACE" }, select: { isActive: true } }),
    prisma.user.findUnique({
      where: { email: "ceo@bizaflow.app" },
      select: { email: true, role: true },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: Boolean(ceo && settings),
        countries,
        provinces,
        territories,
        cities,
        categories,
        platformSettingsActive: settings?.isActive ?? false,
        ceo: ceo ? { email: ceo.email, role: ceo.role } : null,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
