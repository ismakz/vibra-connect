import { ContactPreference } from "@prisma/client";
import { z } from "zod";

export const userProfilePatchSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(120),
  phone: z.string().max(40),
  cityId: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === "" ? null : v.trim())),
  avatarUrl: z.union([z.string().url("URL d’avatar invalide.").max(500), z.literal("")]),
  contactPreference: z.nativeEnum(ContactPreference),
});

export type UserProfilePatchInput = z.infer<typeof userProfilePatchSchema>;
