import type { SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PlatformSettingsResolved = {
  defaultAgentCommission: number;
  freePlanPrice: number;
  standardPlanPrice: number;
  premiumPlanPrice: number;
  sponsoredPlanPrice: number;
  maxProductsFree: number;
  maxProductsStandard: number;
  maxProductsPremium: number;
  maxGalleryImages: number;
  sponsoredBoostLevel: number;
  maintenanceMode: boolean;
  mtnMomoRwandaNumber: string;
  mtnMomoRwandaCountry: string;
  mtnMomoRwandaCurrency: string;
  mtnMomoRwandaEnabled: boolean;
  airtelMoneyRdcNumber: string;
  airtelMoneyRdcCountry: string;
  airtelMoneyRdcCurrency: string;
  airtelMoneyRdcEnabled: boolean;
};

export const FALLBACK_PLATFORM_SETTINGS: PlatformSettingsResolved = {
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
};

type CacheState = {
  data: PlatformSettingsResolved;
  expiresAt: number;
};

let cache: CacheState | null = null;
const CACHE_TTL_MS = 30_000;

function toNumber(v: unknown, fallback: number) {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (v && typeof v === "object" && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    const n = (v as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type PlatformSettingsRaw = {
  defaultAgentCommission?: unknown;
  freePlanPrice?: unknown;
  standardPlanPrice?: unknown;
  premiumPlanPrice?: unknown;
  sponsoredPlanPrice?: unknown;
  maxProductsFree?: unknown;
  maxProductsStandard?: unknown;
  maxProductsPremium?: unknown;
  maxGalleryImages?: unknown;
  sponsoredBoostLevel?: unknown;
  maintenanceMode?: unknown;
  mtnMomoRwandaNumber?: unknown;
  mtnMomoRwandaCountry?: unknown;
  mtnMomoRwandaCurrency?: unknown;
  mtnMomoRwandaEnabled?: unknown;
  airtelMoneyRdcNumber?: unknown;
  airtelMoneyRdcCountry?: unknown;
  airtelMoneyRdcCurrency?: unknown;
  airtelMoneyRdcEnabled?: unknown;
};

function normalizeSettings(raw: PlatformSettingsRaw | null | undefined): PlatformSettingsResolved {
  const r = raw ?? {};
  return {
    defaultAgentCommission: toNumber(r.defaultAgentCommission, FALLBACK_PLATFORM_SETTINGS.defaultAgentCommission),
    freePlanPrice: toNumber(r.freePlanPrice, FALLBACK_PLATFORM_SETTINGS.freePlanPrice),
    standardPlanPrice: toNumber(r.standardPlanPrice, FALLBACK_PLATFORM_SETTINGS.standardPlanPrice),
    premiumPlanPrice: toNumber(r.premiumPlanPrice, FALLBACK_PLATFORM_SETTINGS.premiumPlanPrice),
    sponsoredPlanPrice: toNumber(r.sponsoredPlanPrice, FALLBACK_PLATFORM_SETTINGS.sponsoredPlanPrice),
    maxProductsFree: Math.max(1, Math.floor(toNumber(r.maxProductsFree, FALLBACK_PLATFORM_SETTINGS.maxProductsFree))),
    maxProductsStandard: Math.max(
      1,
      Math.floor(toNumber(r.maxProductsStandard, FALLBACK_PLATFORM_SETTINGS.maxProductsStandard)),
    ),
    maxProductsPremium: Math.max(
      1,
      Math.floor(toNumber(r.maxProductsPremium, FALLBACK_PLATFORM_SETTINGS.maxProductsPremium)),
    ),
    maxGalleryImages: Math.max(1, Math.floor(toNumber(r.maxGalleryImages, FALLBACK_PLATFORM_SETTINGS.maxGalleryImages))),
    sponsoredBoostLevel: Math.max(
      1,
      Math.floor(toNumber(r.sponsoredBoostLevel, FALLBACK_PLATFORM_SETTINGS.sponsoredBoostLevel)),
    ),
    maintenanceMode: Boolean(r.maintenanceMode ?? FALLBACK_PLATFORM_SETTINGS.maintenanceMode),
    mtnMomoRwandaNumber: String(r.mtnMomoRwandaNumber ?? FALLBACK_PLATFORM_SETTINGS.mtnMomoRwandaNumber).trim(),
    mtnMomoRwandaCountry: String(r.mtnMomoRwandaCountry ?? FALLBACK_PLATFORM_SETTINGS.mtnMomoRwandaCountry).trim(),
    mtnMomoRwandaCurrency: String(
      r.mtnMomoRwandaCurrency ?? FALLBACK_PLATFORM_SETTINGS.mtnMomoRwandaCurrency,
    ).trim(),
    mtnMomoRwandaEnabled: Boolean(r.mtnMomoRwandaEnabled ?? FALLBACK_PLATFORM_SETTINGS.mtnMomoRwandaEnabled),
    airtelMoneyRdcNumber: String(r.airtelMoneyRdcNumber ?? FALLBACK_PLATFORM_SETTINGS.airtelMoneyRdcNumber).trim(),
    airtelMoneyRdcCountry: String(r.airtelMoneyRdcCountry ?? FALLBACK_PLATFORM_SETTINGS.airtelMoneyRdcCountry).trim(),
    airtelMoneyRdcCurrency: String(
      r.airtelMoneyRdcCurrency ?? FALLBACK_PLATFORM_SETTINGS.airtelMoneyRdcCurrency,
    ).trim(),
    airtelMoneyRdcEnabled: Boolean(r.airtelMoneyRdcEnabled ?? FALLBACK_PLATFORM_SETTINGS.airtelMoneyRdcEnabled),
  };
}

export async function getPlatformSettings(forceRefresh = false): Promise<PlatformSettingsResolved> {
  if (!forceRefresh && cache && cache.expiresAt > Date.now()) return cache.data;
  try {
    const row = await prisma.platformSettings.findUnique({
      where: { singletonKey: "MARKETPLACE" },
      select: {
        defaultAgentCommission: true,
        freePlanPrice: true,
        standardPlanPrice: true,
        premiumPlanPrice: true,
        sponsoredPlanPrice: true,
        maxProductsFree: true,
        maxProductsStandard: true,
        maxProductsPremium: true,
        maxGalleryImages: true,
        sponsoredBoostLevel: true,
        maintenanceMode: true,
        mtnMomoRwandaNumber: true,
        mtnMomoRwandaCountry: true,
        mtnMomoRwandaCurrency: true,
        mtnMomoRwandaEnabled: true,
        airtelMoneyRdcNumber: true,
        airtelMoneyRdcCountry: true,
        airtelMoneyRdcCurrency: true,
        airtelMoneyRdcEnabled: true,
      },
    });
    const normalized = normalizeSettings(row ?? FALLBACK_PLATFORM_SETTINGS);
    cache = { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS };
    return normalized;
  } catch {
    return FALLBACK_PLATFORM_SETTINGS;
  }
}

export async function upsertPlatformSettings(
  input: PlatformSettingsResolved,
): Promise<PlatformSettingsResolved> {
  const normalized = normalizeSettings(input);
  const saved = await prisma.platformSettings.upsert({
    where: { singletonKey: "MARKETPLACE" },
    update: {
      isActive: true,
      defaultAgentCommission: normalized.defaultAgentCommission,
      freePlanPrice: normalized.freePlanPrice,
      standardPlanPrice: normalized.standardPlanPrice,
      premiumPlanPrice: normalized.premiumPlanPrice,
      sponsoredPlanPrice: normalized.sponsoredPlanPrice,
      maxProductsFree: normalized.maxProductsFree,
      maxProductsStandard: normalized.maxProductsStandard,
      maxProductsPremium: normalized.maxProductsPremium,
      maxGalleryImages: normalized.maxGalleryImages,
      sponsoredBoostLevel: normalized.sponsoredBoostLevel,
      maintenanceMode: normalized.maintenanceMode,
      mtnMomoRwandaNumber: normalized.mtnMomoRwandaNumber,
      mtnMomoRwandaCountry: normalized.mtnMomoRwandaCountry,
      mtnMomoRwandaCurrency: normalized.mtnMomoRwandaCurrency,
      mtnMomoRwandaEnabled: normalized.mtnMomoRwandaEnabled,
      airtelMoneyRdcNumber: normalized.airtelMoneyRdcNumber,
      airtelMoneyRdcCountry: normalized.airtelMoneyRdcCountry,
      airtelMoneyRdcCurrency: normalized.airtelMoneyRdcCurrency,
      airtelMoneyRdcEnabled: normalized.airtelMoneyRdcEnabled,
    },
    create: {
      singletonKey: "MARKETPLACE",
      isActive: true,
      defaultAgentCommission: normalized.defaultAgentCommission,
      freePlanPrice: normalized.freePlanPrice,
      standardPlanPrice: normalized.standardPlanPrice,
      premiumPlanPrice: normalized.premiumPlanPrice,
      sponsoredPlanPrice: normalized.sponsoredPlanPrice,
      maxProductsFree: normalized.maxProductsFree,
      maxProductsStandard: normalized.maxProductsStandard,
      maxProductsPremium: normalized.maxProductsPremium,
      maxGalleryImages: normalized.maxGalleryImages,
      sponsoredBoostLevel: normalized.sponsoredBoostLevel,
      maintenanceMode: normalized.maintenanceMode,
      mtnMomoRwandaNumber: normalized.mtnMomoRwandaNumber,
      mtnMomoRwandaCountry: normalized.mtnMomoRwandaCountry,
      mtnMomoRwandaCurrency: normalized.mtnMomoRwandaCurrency,
      mtnMomoRwandaEnabled: normalized.mtnMomoRwandaEnabled,
      airtelMoneyRdcNumber: normalized.airtelMoneyRdcNumber,
      airtelMoneyRdcCountry: normalized.airtelMoneyRdcCountry,
      airtelMoneyRdcCurrency: normalized.airtelMoneyRdcCurrency,
      airtelMoneyRdcEnabled: normalized.airtelMoneyRdcEnabled,
    },
    select: {
      defaultAgentCommission: true,
      freePlanPrice: true,
      standardPlanPrice: true,
      premiumPlanPrice: true,
      sponsoredPlanPrice: true,
      maxProductsFree: true,
      maxProductsStandard: true,
      maxProductsPremium: true,
      maxGalleryImages: true,
      sponsoredBoostLevel: true,
      maintenanceMode: true,
      mtnMomoRwandaNumber: true,
      mtnMomoRwandaCountry: true,
      mtnMomoRwandaCurrency: true,
      mtnMomoRwandaEnabled: true,
      airtelMoneyRdcNumber: true,
      airtelMoneyRdcCountry: true,
      airtelMoneyRdcCurrency: true,
      airtelMoneyRdcEnabled: true,
    },
  });

  const next = normalizeSettings(saved);
  cache = { data: next, expiresAt: Date.now() + CACHE_TTL_MS };
  return next;
}

export function productCapForPlan(plan: SubscriptionPlan, settings: PlatformSettingsResolved): number {
  if (plan === "FREE") return settings.maxProductsFree;
  if (plan === "STARTER" || plan === "PRO") return settings.maxProductsStandard;
  return settings.maxProductsPremium;
}

export function galleryCapForPlan(_plan: SubscriptionPlan, settings: PlatformSettingsResolved): number {
  if (_plan === "FREE") return Math.max(2, Math.floor(settings.maxGalleryImages / 2));
  if (_plan === "STARTER" || _plan === "PRO") return Math.max(4, settings.maxGalleryImages - 2);
  return settings.maxGalleryImages;
}

