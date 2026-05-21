import { Prisma } from "@prisma/client";

import { DEFAULT_CATEGORY_NAMES } from "@/lib/category-catalog";
import { getLocationTree } from "@/lib/location-queries";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const fallbackCities = [
  { id: "fallback-kinshasa", name: "Kinshasa", slug: "kinshasa" },
  { id: "fallback-goma", name: "Goma", slug: "goma" },
  { id: "fallback-lubumbashi", name: "Lubumbashi", slug: "lubumbashi" },
];

const fallbackCategories = DEFAULT_CATEGORY_NAMES.map((name) => ({
  id: `fallback-${slugify(name)}`,
  name,
  slug: slugify(name),
}));

export async function getLandingData() {
  try {
    const [cities, categories, featuredRaw, locationTree] = await Promise.all([
      prisma.city.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, take: 56 }),
      prisma.business.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { subscriptionPlan: "FREE" },
            {
              subscriptionStatus: "ACTIVE",
              OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
            },
          ],
        },
        include: {
          city: true,
          category: true,
          reviews: {
            select: { rating: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
        orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      getLocationTree(),
    ]);

    const nowMs = Date.now();
    const featured = featuredRaw.map((b) => {
      const ratings = (b.reviews ?? [])
        .map((r) => r.rating)
        .filter((r): r is number => typeof r === "number");

      const rating =
        ratings.length > 0 ? Math.round((ratings.reduce((a, c) => a + c, 0) / ratings.length) * 10) / 10 : null;

      const contactPhone = b.whatsappNumber ?? b.whatsapp ?? b.phoneNumber ?? b.phone ?? null;

      return {
        id: b.id,
        slug: b.slug,
        name: b.name,
        description: b.description ?? null,
        verified: b.verified,
        city: { name: b.city.name, slug: b.city.slug },
        category: { name: b.category.name, slug: b.category.slug },
        bannerUrl: b.bannerUrl ?? null,
        logoUrl: b.logoUrl ?? null,
        openingHours: b.openingHours ?? null,
        contactPhone,
        rating,
        isSponsored: b.featuredUntil ? b.featuredUntil.getTime() > nowMs : false,
      };
    });

    return { cities, categories, featured, locationTree, databaseAvailable: true };
  } catch {
    return {
      cities: fallbackCities,
      categories: fallbackCategories,
      featured: [],
      locationTree: [],
      databaseAvailable: false,
    };
  }
}

export async function getExplorerFilters() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return { categories, databaseAvailable: true };
  } catch {
    return {
      categories: fallbackCategories,
      databaseAvailable: false,
    };
  }
}

export async function searchBusinesses(params: {
  q?: string;
  city?: string;
  category?: string;
  status?: string;
  sort?: string;
}) {
  const now = new Date();
  const status = (params.status ?? "all").toLowerCase();
  const sort = (params.sort ?? "recent").toLowerCase();

  const where: Prisma.BusinessWhereInput = {
    status: "ACTIVE",
    OR: [
      { subscriptionPlan: "FREE" },
      {
        subscriptionStatus: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    ],
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.city ? { city: { slug: params.city } } : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(status === "verified" ? { verified: true } : {}),
    ...(status === "promotions"
      ? {
          promotions: {
            some: {
              status: "PUBLISHED",
              OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
            },
          },
        }
      : {}),
    ...(status === "sponsored" ? { featuredUntil: { gt: now } } : {}),
  };

  try {
    return await prisma.business.findMany({
      where,
      include: {
        city: true,
        category: true,
        reviews: {
          select: { rating: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        promotions: {
          where: {
            status: "PUBLISHED",
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          select: { id: true },
          take: 1,
        },
        _count: {
          select: { viewEvents: true },
        },
      },
      orderBy:
        sort === "popular"
          ? [{ viewEvents: { _count: "desc" } }, { createdAt: "desc" }]
          : [{ verified: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}
