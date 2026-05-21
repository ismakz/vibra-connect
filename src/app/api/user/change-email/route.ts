import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeEmailSchema } from "@/lib/validations/user-security";

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

  const parsed = changeEmailSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ ok: false as const, error: msg }, { status: 400 });
  }

  const { currentPassword, newEmail } = parsed.data;
  const newNorm = newEmail.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false as const, error: "Utilisateur introuvable." }, { status: 404 });
  }

  if (user.email.toLowerCase() === newNorm) {
    return NextResponse.json({ ok: false as const, error: "La nouvelle adresse est identique à l’actuelle." }, { status: 400 });
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ ok: false as const, error: "Mot de passe actuel incorrect." }, { status: 403 });
  }

  const taken = await prisma.user.findFirst({
    where: { email: { equals: newNorm, mode: "insensitive" }, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ ok: false as const, error: "Cette adresse e-mail est déjà utilisée." }, { status: 409 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newNorm },
    });
  } catch {
    return NextResponse.json({ ok: false as const, error: "Impossible de mettre à jour l’e-mail." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true as const,
    message: "E-mail mis à jour. Reconnectez-vous avec votre nouvelle adresse.",
  });
}
