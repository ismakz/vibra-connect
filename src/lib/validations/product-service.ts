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

export const productServiceUpsertBodySchema = z.object({
  title: z.string().trim().min(1, "Titre requis.").max(200),
  description: z.string().trim().min(1, "Description requise.").max(5000),
  currency: z.string().trim().min(1, "Devise requise.").max(10),
  imageUrl: imageUrlField,
  isAvailable: z.boolean(),
  isPromotion: z.boolean(),
  price: priceField,
});

export const productServiceCreateBodySchema = productServiceUpsertBodySchema;

export const productServiceUpdateBodySchema = productServiceUpsertBodySchema.extend({
  id: z.string().min(1, "Identifiant produit requis."),
});

export type ProductServiceUpsertInput = z.infer<typeof productServiceUpsertBodySchema>;
