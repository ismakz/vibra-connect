import { z } from "zod";

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est obligatoire."),
  newEmail: z.string().trim().email("Nouvelle adresse e-mail invalide."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est obligatoire."),
    newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères."),
    confirmPassword: z.string().min(6, "Confirmez le nouveau mot de passe."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });
