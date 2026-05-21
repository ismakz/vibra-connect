import type { Prisma } from "@prisma/client";

export type UrgentSaleRowLike = {
  isUrgentSale: boolean;
  urgentSaleStatus: string;
  urgentSaleEndsAt: Date | null;
  originalPrice: unknown;
  urgentPrice: unknown;
};

export function decimalLikeToNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Affichage marketplace / vitrine : urgence visible tant que règles métier OK (sans supprimer le produit). */
export function isUrgentSaleLiveForDisplay(row: UrgentSaleRowLike, now = new Date()): boolean {
  if (!row.isUrgentSale || row.urgentSaleStatus !== "ACTIVE") return false;
  if (!row.urgentSaleEndsAt || row.urgentSaleEndsAt.getTime() <= now.getTime()) return false;
  const original = decimalLikeToNumber(row.originalPrice);
  const urgent = decimalLikeToNumber(row.urgentPrice);
  if (original == null || urgent == null) return false;
  return urgent < original;
}

export function urgentSaleLivePrismaWhere(now: Date): Prisma.ProductServiceWhereInput {
  return {
    isUrgentSale: true,
    urgentSaleStatus: "ACTIVE",
    urgentSaleEndsAt: { gt: now },
    originalPrice: { not: null },
    urgentPrice: { not: null },
  };
}
