import type {
  BusinessStatus,
  PaymentStatus,
  ReportStatus,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CeoCommandCenterOverview =
  | {
      ok: true;
      kpis: {
        totalUsers: number;
        totalBusinesses: number;
        activeBusinesses: number;
        activeSubscriptions: number;
        revenueApproved: number;
        activeAgents: number;
        businessViews: number;
        whatsappClicks: number;
        conversionRate: number;
      };
      recentPayments: Array<{
        id: string;
        reference: string;
        amount: number;
        currency: string;
        status: PaymentStatus;
        paymentMethod: string;
        requestedPlan: string;
        proofImageUrl: string | null;
        ceoComment: string | null;
        createdAt: Date;
        businessName: string;
        userEmail: string;
      }>;
      paymentCounts: {
        pending: number;
        approved: number;
        rejected: number;
        expired: number;
      };
      agents: Array<{
        id: string;
        code: string;
        commissionRatePct: number;
        totalRecruited: number;
        referredBusinessesCount: number;
        userId: string;
        userName: string | null;
        userEmail: string;
        commissionsTotal: number;
        commissionsPaid: number;
        commissionsPending: number;
        potentialFutureCommissions: number;
      }>;
      reportsOpen: Array<{
        id: string;
        reason: string;
        status: ReportStatus;
        createdAt: Date;
        businessName: string;
        businessSlug: string;
      }>;
      blockedBusinesses: number;
      analytics: {
        signupsByDay: Array<{ day: string; count: number }>;
        businessesByDay: Array<{ day: string; count: number }>;
        viewsByDay: Array<{ day: string; count: number }>;
        topCities: Array<{ name: string; count: number }>;
        topCategories: Array<{ name: string; count: number }>;
      };
    }
  | { ok: false; error: string };

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function startOfDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function bucketByUtcDay(dates: Date[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const dt of dates) {
    const key = dt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function fillLastDays(map: Map<string, number>, days: number): Array<{ day: string; count: number }> {
  const out: Array<{ day: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: map.get(key) ?? 0 });
  }
  return out;
}

export async function getCeoCommandCenterOverview(): Promise<CeoCommandCenterOverview> {
  try {
    const since = startOfDaysAgo(30);

    const [
      totalUsers,
      totalBusinesses,
      activeBusinesses,
      activeSubscriptions,
      revenueAgg,
      activeAgents,
      businessViews,
      whatsappClicks,
      pendingPayCount,
      approvedPayCount,
      rejectedPayCount,
      expiredPayCount,
      suspendedBusinesses,
      rejectedBusinesses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.business.count({ where: { status: "ACTIVE" } }),
      prisma.business.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.businessViewEvent.count(),
      prisma.contactClickEvent.count({ where: { type: "WHATSAPP" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "REJECTED" } }),
      prisma.payment.count({ where: { status: "EXPIRED" } }),
      prisma.business.count({ where: { status: "SUSPENDED" } }),
      prisma.business.count({ where: { status: "REJECTED" } }),
    ]);

    const revenueApproved = toNumber(revenueAgg._sum.amount);
    const conversionRate = businessViews > 0 ? Math.round((whatsappClicks / businessViews) * 10000) / 100 : 0;

    const recentPaymentsRaw = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        business: { select: { name: true } },
        user: { select: { email: true } },
      },
    });

    const recentPayments = recentPaymentsRaw.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: toNumber(p.amount),
      currency: p.currency,
      status: p.status,
      paymentMethod: p.paymentMethod,
      requestedPlan: p.requestedPlan,
      proofImageUrl: p.proofImageUrl,
      ceoComment: p.ceoComment,
      createdAt: p.createdAt,
      businessName: p.business.name,
      userEmail: p.user.email,
    }));

    const agentsRaw = await prisma.agentProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        commissions: { select: { amount: true, isPaid: true } },
        _count: { select: { referredBusinesses: true } },
      },
      orderBy: { totalRecruited: "desc" },
      take: 40,
    });
    const pendingPayments = await prisma.payment.findMany({
      where: { status: "PENDING" },
      select: {
        amount: true,
        business: {
          select: { referralAgentId: true },
        },
      },
      take: 2000,
    });
    const pendingByAgent = new Map<string, number>();
    for (const row of pendingPayments) {
      const agentId = row.business.referralAgentId;
      if (!agentId) continue;
      pendingByAgent.set(agentId, (pendingByAgent.get(agentId) ?? 0) + toNumber(row.amount));
    }

    const agents = agentsRaw.map((a) => {
      let commissionsTotal = 0;
      let commissionsPaid = 0;
      let commissionsPending = 0;
      for (const c of a.commissions) {
        const amt = toNumber(c.amount);
        commissionsTotal += amt;
        if (c.isPaid) commissionsPaid += amt;
        else commissionsPending += amt;
      }
      return {
        id: a.id,
        code: a.code,
        commissionRatePct: Math.round(toNumber(a.commissionRate) * 100) / 100,
        totalRecruited: a._count.referredBusinesses,
        referredBusinessesCount: a._count.referredBusinesses,
        userId: a.userId,
        userName: a.user.name,
        userEmail: a.user.email,
        commissionsTotal,
        commissionsPaid,
        commissionsPending,
        potentialFutureCommissions: pendingByAgent.get(a.id) ?? 0,
      };
    });

    const reportsOpen = await prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { business: { select: { name: true, slug: true } } },
    });

    const reportsOpenMapped = reportsOpen.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      businessName: r.business.name,
      businessSlug: r.business.slug,
    }));

    const [usersRecent, businessesRecent, viewsRecent, cityGroupsRaw, categoryGroupsRaw] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.business.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.businessViewEvent.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.business.groupBy({
        by: ["cityId"],
        _count: { _all: true },
      }),
      prisma.business.groupBy({
        by: ["categoryId"],
        _count: { _all: true },
      }),
    ]);

    const cityGroups = [...cityGroupsRaw].sort((a, b) => b._count._all - a._count._all).slice(0, 8);
    const categoryGroups = [...categoryGroupsRaw].sort((a, b) => b._count._all - a._count._all).slice(0, 8);

    const cityIds = cityGroups.map((g) => g.cityId);
    const categoryIds = categoryGroups.map((g) => g.categoryId);
    const [cities, categories] = await Promise.all([
      prisma.city.findMany({ where: { id: { in: cityIds } }, select: { id: true, name: true } }),
      prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }),
    ]);
    const cityName = new Map(cities.map((c) => [c.id, c.name]));
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));

    const topCities = cityGroups.map((g) => ({
      name: cityName.get(g.cityId) ?? g.cityId,
      count: g._count._all,
    }));
    const topCategories = categoryGroups.map((g) => ({
      name: categoryName.get(g.categoryId) ?? g.categoryId,
      count: g._count._all,
    }));

    const signupsMap = bucketByUtcDay(usersRecent.map((u) => u.createdAt));
    const bizMap = bucketByUtcDay(businessesRecent.map((b) => b.createdAt));
    const viewsMap = bucketByUtcDay(viewsRecent.map((v) => v.createdAt));

    return {
      ok: true,
      kpis: {
        totalUsers,
        totalBusinesses,
        activeBusinesses,
        activeSubscriptions,
        revenueApproved,
        activeAgents,
        businessViews,
        whatsappClicks,
        conversionRate,
      },
      recentPayments,
      paymentCounts: {
        pending: pendingPayCount,
        approved: approvedPayCount,
        rejected: rejectedPayCount,
        expired: expiredPayCount,
      },
      agents,
      reportsOpen: reportsOpenMapped,
      blockedBusinesses: suspendedBusinesses + rejectedBusinesses,
      analytics: {
        signupsByDay: fillLastDays(signupsMap, 30),
        businessesByDay: fillLastDays(bizMap, 30),
        viewsByDay: fillLastDays(viewsMap, 30),
        topCities,
        topCategories,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur base de données";
    return { ok: false, error: message };
  }
}

export type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  verified: boolean;
  subscriptionPlan: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  cityName: string;
  categoryName: string;
  ownerEmail: string;
  ownerName: string | null;
};

export async function getCeoBusinessesPage(params: {
  page: number;
  pageSize: number;
  q: string;
  status: BusinessStatus | "all";
}): Promise<
  | { ok: true; rows: BusinessRow[]; total: number; page: number; pageSize: number }
  | { ok: false; error: string }
> {
  try {
    const { page, pageSize, q, status } = params;
    const skip = (page - 1) * pageSize;
    const where = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
              { owner: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
      ...(status !== "all" ? { status } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.business.count({ where }),
      prisma.business.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          city: { select: { name: true } },
          category: { select: { name: true } },
          owner: { select: { email: true, name: true } },
        },
      }),
    ]);

    return {
      ok: true,
      total,
      page,
      pageSize,
      rows: rows.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        status: b.status,
        verified: b.verified,
        subscriptionPlan: b.subscriptionPlan,
        subscriptionStatus: b.subscriptionStatus,
        createdAt: b.createdAt,
        cityName: b.city.name,
        categoryName: b.category.name,
        ownerEmail: b.owner.email,
        ownerName: b.owner.name,
      })),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur base de données";
    return { ok: false, error: message };
  }
}

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  businessesCount: number;
  paymentsCount: number;
  reportsCount: number;
};

export async function getCeoUsersPage(params: {
  page: number;
  pageSize: number;
  q: string;
  role: UserRole | "all";
}): Promise<{ ok: true; rows: UserRow[]; total: number; page: number; pageSize: number } | { ok: false; error: string }> {
  try {
    const { page, pageSize, q, role } = params;
    const skip = (page - 1) * pageSize;
    const where = {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(role !== "all" ? { role } : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { businesses: true, payments: true, reports: true } },
        },
      }),
    ]);

    return {
      ok: true,
      total,
      page,
      pageSize,
      rows: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        businessesCount: u._count.businesses,
        paymentsCount: u._count.payments,
        reportsCount: u._count.reports,
      })),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur base de données";
    return { ok: false, error: message };
  }
}
