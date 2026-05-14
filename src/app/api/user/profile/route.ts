import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userProfilePatchSchema } from "@/lib/validations/user-profile";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        contactPreference: true,
        createdAt: true,
        cityId: true,
        city: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Utilisateur introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true as const, user });
  } catch {
    return NextResponse.json({ ok: false, error: "Base de données indisponible." }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = userProfilePatchSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const { name, phone, cityId, avatarUrl, contactPreference } = parsed.data;
  const phoneNorm = phone.trim() || null;
  const avatarNorm = avatarUrl.trim() === "" ? null : avatarUrl.trim();

  if (cityId) {
    const city = await prisma.city.findFirst({ where: { id: cityId, isActive: true }, select: { id: true } });
    if (!city) {
      return NextResponse.json({ ok: false, error: "Ville invalide ou inactive." }, { status: 400 });
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        phone: phoneNorm,
        cityId: cityId ?? null,
        avatarUrl: avatarNorm,
        contactPreference,
      },
    });
    return NextResponse.json({ ok: true as const, message: "Profil mis à jour." });
  } catch {
    return NextResponse.json({ ok: false, error: "Impossible d’enregistrer le profil." }, { status: 500 });
  }
}
