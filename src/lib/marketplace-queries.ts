import { Prisma, type SubscriptionPlan } from "@prisma/client";

import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export type MarketplaceSort = "popular" | "recent" | "views" | "premium";

export type MarketplacePlanFilter = "all" | "free" | "standard" | "premium" | "sponsored";

const PAGE_SIZE = 12;

const marketplaceIncludeBase = {
  city: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  reviews: { select: { rating: true }, orderBy: { createdAt: "desc" as const }, take: 24 },
  _count: { select: { viewEvents: true } },
} satisfies Prisma.BusinessInclude;

function planWhere(plan: MarketplacePlanFilter, now: Date): Prisma.BusinessWhereInput | undefined {
  if (plan === "all") return undefined;
  if (plan === "free") return { subscriptionPlan: "FREE" };
  if (plan === "standard") return { subscriptionPlan: { in: ["STARTER", "PRO"] } };
  if (plan === "premium") return { subscriptionPlan: { in: ["PREMIUM", "SPONSORED"] } };
  if (plan === "sponsored") return { featuredUntil: { gt: now } };
  return undefined;
}

function orderByForSort(
  sort: MarketplaceSort,
  sponsoredBoostLevel: number,
): Prisma.BusinessOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
    case "views":
      return sponsoredBoostLevel > 1
        ? [{ featuredUntil: "desc" }, { viewEvents: { _count: "desc" } }, { createdAt: "desc" }, { id: "desc" }]
        : [{ viewEvents: { _count: "desc" } }, { createdAt: "desc" }, { id: "desc" }];
    case "premium":
      return [{ verified: "desc" }, { featuredUntil: "desc" }, { createdAt: "desc" }, { id: "desc" }];
    case "recent":
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export type MarketplaceBusinessRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  verified: boolean;
  bannerUrl: string | null;
  logoUrl: string | null;
  openingHours: string | null;
  featuredUntil: Date | null;
  subscriptionPlan: SubscriptionPlan;
  whatsapp: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  phoneNumber: string | null;
  city: { name: string; slug: string };
  category: { name: string; slug: string };
  reviews: { rating: number }[];
  promotions: { id: string }[];
  _count: { viewEvents: number };
};

export async function getMarketplaceBusinessesPage(params: {
  q?: string;
  city?: string;
  category?: string;
  plan?: MarketplacePlanFilter;
  sponsoredOnly?: boolean;
  sort?: MarketplaceSort;
  page?: number;
}): Promise<
  | {
      ok: true;
      rows: MarketplaceBusinessRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | { ok: false; error: string }
> {
  const now = new Date();
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const sort = (params.sort ?? "recent") as MarketplaceSort;
  const planFilter = (params.plan ?? "all") as MarketplacePlanFilter;
  const settings = await getPlatformSettings();

  const text = params.q?.trim();
  const planClause = planWhere(planFilter, now);
  const sponsoredClause: Prisma.BusinessWhereInput | undefined =
    params.sponsoredOnly ? { featuredUntil: { gt: now } } : undefined;

  const promotionFilter = {
    status: "PUBLISHED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };

  const where: Prisma.BusinessWhereInput = {
    status: "ACTIVE",
    OR: [
      { subscriptionPlan: "FREE" },
      {
        subscriptionStatus: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    ],
    ...(text
      ? {
          OR: [
            { name: { contains: text, mode: "insensitive" } },
            { description: { contains: text, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.city ? { city: { slug: params.city } } : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(planClause ? planClause : {}),
    ...(sponsoredClause ? sponsoredClause : {}),
  };

  try {
    const include = {
      ...marketplaceIncludeBase,
      promotions: {
        where: promotionFilter,
        select: { id: true },
        take: 1,
      },
    };

    const [total, rows] = await Promise.all([
      prisma.business.count({ where }),
      prisma.business.findMany({
        where,
        include,
        orderBy: orderByForSort(sort, settings.sponsoredBoostLevel),
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      ok: true,
      rows: rows as MarketplaceBusinessRow[],
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur base de données";
    return { ok: false, error: message };
  }
}

export async function getSimilarMarketplaceRows(
  businessId: string,
  categoryId: string,
  cityId: string,
  limit = 4,
): Promise<MarketplaceBusinessRow[]> {
  const now = new Date();
  const promotionFilter = {
    status: "PUBLISHED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };
  try {
    const rows = await prisma.business.findMany({
      where: {
        id: { not: businessId },
        status: "ACTIVE",
        AND: [
          {
            OR: [
              { subscriptionPlan: "FREE" },
              {
                subscriptionStatus: "ACTIVE",
                OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
              },
            ],
          },
          { OR: [{ categoryId }, { cityId }] },
        ],
      },
      include: {
        ...marketplaceIncludeBase,
        promotions: {
          where: promotionFilter,
          select: { id: true },
          take: 1,
        },
      },
      orderBy: [{ verified: "desc" }, { viewEvents: { _count: "desc" } }, { createdAt: "desc" }],
      take: limit,
    });
    return rows as MarketplaceBusinessRow[];
  } catch {
    return [];
  }
}
