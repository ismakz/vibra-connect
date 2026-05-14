import { ContactPreference, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { maxGalleryImagesWithSettings } from "@/lib/subscription-rules";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().default(""),
  categoryId: z.string().min(1),
  cityId: z.string().min(1),
  address: z.string().max(300).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  whatsapp: z.string().max(40).optional().default(""),
  email: z.string().max(120).optional().default(""),
  openingHours: z.string().max(120).optional().default(""),
  logoUrl: z.string().max(500).optional().default(""),
  bannerUrl: z.string().max(500).optional().default(""),
  galleryImages: z.string().max(4000).optional().default(""),
  contactPreference: z.nativeEnum(ContactPreference),
});

function parseGalleryImages(input: string, maxGalleryImages: number) {
  const urls = input
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, maxGalleryImages);

  const validator = z.string().url();
  for (const url of urls) {
    if (!validator.safeParse(url).success) {
      return { ok: false as const, urls: [] as string[] };
    }
  }
  return { ok: true as const, urls };
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, subscriptionPlan: true },
    });
    if (!business) return NextResponse.json({ ok: false, error: "Business introuvable." }, { status: 404 });

    const parsedEmail = parsed.data.email.trim();
    if (parsedEmail && !z.string().email().safeParse(parsedEmail).success) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
    }

    const settings = await getPlatformSettings();
    const galleryCap = maxGalleryImagesWithSettings(business.subscriptionPlan, settings);
    const gallery = parseGalleryImages(parsed.data.galleryImages, galleryCap);
    if (!gallery.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `La galerie contient au moins une URL invalide (maximum ${galleryCap} images pour votre plan).`,
        },
        { status: 400 },
      );
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description.trim() || null,
        categoryId: parsed.data.categoryId,
        cityId: parsed.data.cityId,
        address: parsed.data.address.trim() || null,
        email: parsedEmail || null,
        phone: parsed.data.phone.trim() || null,
        whatsapp: parsed.data.whatsapp.trim() || null,
        phoneNumber: parsed.data.phone.trim() || null,
        whatsappNumber: parsed.data.whatsapp.trim() || null,
        openingHours: parsed.data.openingHours.trim() || null,
        logoUrl: parsed.data.logoUrl.trim() || null,
        bannerUrl: parsed.data.bannerUrl.trim() || null,
        galleryImages: gallery.urls,
        contactPreference: parsed.data.contactPreference,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Profil sauvegardé.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur pendant la sauvegarde." }, { status: 500 });
  }
}
