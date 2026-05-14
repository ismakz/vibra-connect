import type { UserRole } from "@prisma/client";

/** Tableau de bord principal — convention Bizaflow (rôle technique Prisma : `SUPER_ADMIN`). */
export const CEO_DASHBOARD_PATH = "/dashboard/ceo";

export const CEO_API_OVERVIEW_PATH = "/api/ceo/overview";

/** Anciennes URLs — redirigées en 308 par le middleware. */
export const LEGACY_SUPER_ADMIN_DASHBOARD_PREFIX = "/dashboard/super-admin";
export const LEGACY_SUPER_ADMIN_API_PREFIX = "/api/super-admin";

/**
 * Accès plateforme « CEO » : aujourd’hui identique à `SUPER_ADMIN` côté JWT / Prisma.
 * `CEO` est réservé si le schéma évolue plus tard.
 */
export function isPlatformCeoRole(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN" || role === "CEO";
}

/** Libellés UI — ne pas exposer « Super Admin » aux utilisateurs. */
export function formatUserRoleForUi(role: UserRole | string): string {
  if (role === "SUPER_ADMIN") return "CEO";
  return String(role);
}
