import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { maxPublishedProductsWithSettings } from "@/lib/subscription-rules";
import {
  productServiceCreateBodySchema,
  productServiceUpdateBodySchema,
} from "@/lib/validations/product-service";

function validationError(error: { issues: { message: string }[] }) {
  const msg = error.issues[0]?.message ?? "Données invalides.";
  return NextResponse.json({ ok: false as const, error: msg }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = productServiceCreateBodySchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, subscriptionPlan: true },
    });
    if (!business) return NextResponse.json({ ok: false, error: "Business introuvable." }, { status: 404 });
    const settings = await getPlatformSettings();

    const publishedCount = await prisma.productService.count({
      where: { businessId: business.id, status: "PUBLISHED" },
    });
    const cap = maxPublishedProductsWithSettings(business.subscriptionPlan, settings);
    if (publishedCount >= cap) {
      return NextResponse.json(
        {
          ok: false,
          error: `Limite du plan atteinte (${cap} produits publiés). Passez à un plan supérieur via Bizapay pour en ajouter.`,
        },
        { status: 403 },
      );
    }

    const images = parsed.data.imageUrl ? [parsed.data.imageUrl] : [];

    await prisma.productService.create({
      data: {
        businessId: business.id,
        title: parsed.data.title,
        description: parsed.data.description,
        currency: parsed.data.currency,
        price: parsed.data.price,
        images,
        isAvailable: parsed.data.isAvailable,
        isPromotion: parsed.data.isPromotion,
      },
    });

    return NextResponse.json({ ok: true as const, message: "Produit / service créé." });
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur pendant la création." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = productServiceUpdateBodySchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (!business) return NextResponse.json({ ok: false, error: "Business introuvable." }, { status: 404 });

    const images = parsed.data.imageUrl ? [parsed.data.imageUrl] : [];

    const result = await prisma.productService.updateMany({
      where: { id: parsed.data.id, businessId: business.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        currency: parsed.data.currency,
        price: parsed.data.price,
        images,
        isAvailable: parsed.data.isAvailable,
        isPromotion: parsed.data.isPromotion,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "Produit / service introuvable ou non autorisé." }, { status: 404 });
    }

    return NextResponse.json({ ok: true as const, message: "Produit / service mis à jour." });
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur pendant la mise à jour." }, { status: 500 });
  }
}
