import type { UserRole } from "@prisma/client";

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
  return "/explore";
}
