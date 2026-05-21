import type { UserRole } from "@prisma/client";

import { isPlatformCeoRole } from "@/lib/ceo-platform";

/** Marketplace publique — jamais de garde auth sur ce lien. */
export const EXPLORE_MARKET_HREF = "/explore";

const PUBLISH_CALLBACK = "/dashboard/business/create";

/**
 * Lien unique « Business » / « Publier mon business » (top nav, landing, etc.).
 * Invités → inscription avec callback, jamais /login.
 */
export function getBusinessHref(userRole: UserRole | string | null | undefined, isAuthenticated: boolean): string {
  if (!isAuthenticated || !userRole) {
    return `/register?callbackUrl=${encodeURIComponent(PUBLISH_CALLBACK)}`;
  }
  if (userRole === "BUSINESS_OWNER") return "/dashboard/business";
  if (isPlatformCeoRole(userRole)) return "/dashboard/ceo";
  if (userRole === "AGENT") return "/agent";
  if (userRole === "CLIENT") return PUBLISH_CALLBACK;
  return `/register?callbackUrl=${encodeURIComponent(PUBLISH_CALLBACK)}`;
}

/** Badge affiché dans la top nav (convention produit). */
export function navRoleBadge(role: UserRole | string): string {
  if (role === "SUPER_ADMIN") return "CEO";
  if (role === "BUSINESS_OWNER") return "BUSINESS";
  if (role === "AGENT") return "AGENT";
  return "CLIENT";
}

export function dashboardHrefForRole(role: UserRole | string): string {
  if (role === "SUPER_ADMIN") return "/dashboard/ceo";
  if (role === "BUSINESS_OWNER") return "/dashboard/business";
  if (role === "AGENT") return "/dashboard/agent";
  return EXPLORE_MARKET_HREF;
}
