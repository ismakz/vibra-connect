import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { registerBodySchema } from "@/lib/validations/register";

export type RegisterNewUserOk = {
  ok: true;
  email: string;
  invitedByValidAgent: boolean;
  refProvidedButInvalid: boolean;
};

export type RegisterNewUserErr = { ok: false; status: number; message: string };

export async function registerNewUser(body: unknown): Promise<RegisterNewUserOk | RegisterNewUserErr> {
  const parsed = registerBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    return { ok: false, status: 400, message: msg };
  }

  const { name, email, password, phone, cityId, ref } = parsed.data;
  const emailNorm = email.toLowerCase();

  const exists = await prisma.user.findFirst({
    where: { email: { equals: emailNorm, mode: "insensitive" } },
    select: { id: true },
  });
  if (exists) {
    return { ok: false, status: 409, message: "Cette adresse e-mail est déjà utilisée." };
  }

  let cityIdValue: string | null = null;
  if (cityId) {
    const city = await prisma.city.findFirst({
      where: { id: cityId, isActive: true },
      select: { id: true },
    });
    if (!city) {
      return { ok: false, status: 400, message: "Ville invalide ou inactive." };
    }
    cityIdValue = city.id;
  }

  const normalizedRef = ref.trim().toUpperCase();
  let referredByAgentId: string | null = null;
  let invitedByValidAgent = false;
  let refProvidedButInvalid = false;

  if (normalizedRef.length >= 2) {
    const agent = await prisma.agentProfile.findFirst({
      where: { code: { equals: normalizedRef, mode: "insensitive" } },
      select: { id: true },
    });
    if (agent) {
      referredByAgentId = agent.id;
      invitedByValidAgent = true;
    } else {
      refProvidedButInvalid = true;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNorm,
        passwordHash,
        role: UserRole.CLIENT,
        phone: phone.trim() || null,
        cityId: cityIdValue,
        referredByAgentId,
      },
    });
  } catch {
    return { ok: false, status: 500, message: "Impossible de créer le compte. Réessayez." };
  }

  return { ok: true, email: emailNorm, invitedByValidAgent, refProvidedButInvalid };
}
