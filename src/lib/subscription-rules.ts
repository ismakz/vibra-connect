import type { Business, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import {
  FALLBACK_PLATFORM_SETTINGS,
  type PlatformSettingsResolved,
  productCapForPlan,
} from "@/lib/platform-settings";

/** Libellés marketplace Bizaflow (schéma Prisma inchangé pour STARTER/PRO). */
export function formatMarketplacePlan(plan: SubscriptionPlan): string {
  switch (plan) {
    case "FREE":
      return "Free";
    case "STARTER":
      return "Standard";
    case "PRO":
      return "Standard+";
    case "PREMIUM":
      return "Premium";
    case "SPONSORED":
      return "Sponsorisé";
    default:
      return plan;
  }
}

export function isPremiumBadgePlan(plan: SubscriptionPlan): boolean {
  return plan === "PREMIUM" || plan === "SPONSORED" || plan === "PRO";
}

export function maxPublishedProducts(plan: SubscriptionPlan): number {
  return productCapForPlan(plan, FALLBACK_PLATFORM_SETTINGS);
}

export function maxPublishedProductsWithSettings(
  plan: SubscriptionPlan,
  settings: PlatformSettingsResolved,
): number {
  return productCapForPlan(plan, settings);
}

export function maxGalleryImages(_plan: SubscriptionPlan): number {
  void _plan;
  return FALLBACK_PLATFORM_SETTINGS.maxGalleryImages;
}

export function maxGalleryImagesWithSettings(
  _plan: SubscriptionPlan,
  settings: PlatformSettingsResolved,
): number {
  return settings.maxGalleryImages;
}

export function hasAdvancedAnalytics(plan: SubscriptionPlan): boolean {
  return plan === "PREMIUM" || plan === "SPONSORED" || plan === "PRO";
}

/** Abonnement considéré actif pour la vitrine marketplace. */
export function isMarketplaceSubscriptionActive(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  expiresAt: Date | null,
): boolean {
  if (status === "EXPIRED" || status === "CANCELLED") return false;
  if (expiresAt && expiresAt.getTime() < Date.now()) return false;
  return true;
}

export function getBusinessSubscriptionUi(business: Pick<Business, "subscriptionPlan" | "subscriptionStatus" | "expiresAt">) {
  const active = isMarketplaceSubscriptionActive(
    business.subscriptionPlan,
    business.subscriptionStatus,
    business.expiresAt,
  );
  return {
    planLabel: formatMarketplacePlan(business.subscriptionPlan),
    active,
    upgradeRecommended:
      !active || business.subscriptionPlan === "FREE" || business.subscriptionStatus === "PENDING",
  };
}
