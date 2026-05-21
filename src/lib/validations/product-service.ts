import { z } from "zod";

const imageUrlField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((s) => (s ?? "").trim())
  .refine((s) => s === "" || z.string().url().safeParse(s).success, { message: "URL d'image invalide." });

const priceField = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === undefined || val === null) return null;
    if (typeof val === "string" && val.trim() === "") return null;
    return typeof val === "number" ? val : Number(String(val).replace(",", ".").trim());
  })
  .refine((n) => n === null || (typeof n === "number" && Number.isFinite(n) && n >= 0), {
    message: "Prix invalide.",
  });

const urgentEndsAtField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((s) => {
    if (s === undefined || s === null) return null;
    const t = String(s).trim();
    return t === "" ? null : t;
  });

export const productServiceUpsertBodySchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis.").max(200),
    description: z.string().trim().min(1, "Description requise.").max(5000),
    currency: z.string().trim().min(1, "Devise requise.").max(10),
    imageUrl: imageUrlField,
    isAvailable: z.boolean(),
    isPromotion: z.boolean(),
    price: priceField,
    isUrgentSale: z.boolean().optional().default(false),
    originalPrice: priceField,
    urgentPrice: priceField,
    urgentSaleReason: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((s) => (s === undefined || s === null ? null : s.trim() || null)),
    urgentSaleEndsAt: urgentEndsAtField,
  })
  .superRefine((data, ctx) => {
    if (!data.isUrgentSale) return;

    if (data.originalPrice == null) {
      ctx.addIssue({ code: "custom", path: ["originalPrice"], message: "Prix normal requis pour une vente en urgence." });
    }
    if (data.urgentPrice == null) {
      ctx.addIssue({ code: "custom", path: ["urgentPrice"], message: "Prix urgence requis." });
    }
    if (data.originalPrice != null && data.urgentPrice != null && data.urgentPrice >= data.originalPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["urgentPrice"],
        message: "Le prix urgence doit être inférieur au prix normal.",
      });
    }

    if (data.urgentSaleReason && data.urgentSaleReason.length > 160) {
      ctx.addIssue({ code: "custom", path: ["urgentSaleReason"], message: "La raison ne peut pas dépasser 160 caractères." });
    }

    const raw = data.urgentSaleEndsAt;
    if (!raw) {
      ctx.addIssue({ code: "custom", path: ["urgentSaleEndsAt"], message: "Date limite requise." });
      return;
    }
    const end = new Date(raw);
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({ code: "custom", path: ["urgentSaleEndsAt"], message: "Date limite invalide." });
      return;
    }
    if (end.getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["urgentSaleEndsAt"], message: "La date limite doit être dans le futur." });
    }
  });

export const productServiceCreateBodySchema = productServiceUpsertBodySchema;

export const productServiceUpdateBodySchema = productServiceUpsertBodySchema.extend({
  id: z.string().min(1, "Identifiant produit requis."),
});

export type ProductServiceUpsertInput = z.infer<typeof productServiceUpsertBodySchema>;
