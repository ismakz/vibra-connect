import { z } from "zod";

/** Inscription publique : toujours rôle CLIENT côté serveur. */
export const registerBodySchema = z
  .object({
    name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z.string().trim().email("Adresse e-mail invalide."),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
    confirmPassword: z.string().min(6, "Confirmez votre mot de passe."),
    phone: z.string().trim().max(40).optional().default(""),
    cityId: z.string().trim().optional().default(""),
    /** Code parrain agent (champ Prisma : `AgentProfile.code`). */
    ref: z.string().trim().optional().default(""),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export type RegisterBodyInput = z.infer<typeof registerBodySchema>;
