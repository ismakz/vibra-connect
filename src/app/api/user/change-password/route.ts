import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/user-security";

export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false as const, error: "Non authentifié." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ ok: false as const, error: msg }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false as const, error: "Utilisateur introuvable." }, { status: 404 });
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ ok: false as const, error: "Mot de passe actuel incorrect." }, { status: 403 });
  }

  const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
  if (sameAsOld) {
    return NextResponse.json({ ok: false as const, error: "Le nouveau mot de passe doit être différent de l’ancien." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  } catch {
    return NextResponse.json({ ok: false as const, error: "Impossible de mettre à jour le mot de passe." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true as const,
    message: "Mot de passe mis à jour avec succès.",
  });
}
