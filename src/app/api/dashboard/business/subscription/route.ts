import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import {
  createBizapayPaymentRequest,
  type MarketplaceRequestedPlan,
} from "@/lib/integrations/bizapay";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  plan: z.enum(["FREE", "STANDARD", "PREMIUM", "SPONSORED"]),
  paymentMethod: z.enum(["AIRTEL_MONEY_RDC", "MTN_MOMO_RWANDA", "MANUAL"]),
  payerPhoneNumber: z.string().min(6).max(40),
  reference: z.string().min(3).max(120),
  proofImageUrl: z.string().max(500).optional().default(""),
  amount: z.number().min(0),
});

function planPrice(plan: MarketplaceRequestedPlan, settings: Awaited<ReturnType<typeof getPlatformSettings>>) {
  if (plan === "FREE") return settings.freePlanPrice;
  if (plan === "STANDARD") return settings.standardPlanPrice;
  if (plan === "PREMIUM") return settings.premiumPlanPrice;
  return settings.sponsoredPlanPrice;
}

function makeReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BIZA-${stamp}-${rnd}`;
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  }

  try {
    const [business, settings] = await Promise.all([
      prisma.business.findFirst({
        where: { ownerId: session.user.id },
        select: { id: true },
      }),
      getPlatformSettings(),
    ]);
    if (!business) return NextResponse.json({ ok: false, error: "Business introuvable." }, { status: 404 });

    const normalizedPlan = parsed.data.plan;
    if (parsed.data.paymentMethod === "MTN_MOMO_RWANDA" && !settings.mtnMomoRwandaEnabled) {
      return NextResponse.json({ ok: false, error: "Méthode MTN MoMo Rwanda indisponible actuellement." }, { status: 400 });
    }
    if (parsed.data.paymentMethod === "AIRTEL_MONEY_RDC" && !settings.airtelMoneyRdcEnabled) {
      return NextResponse.json({ ok: false, error: "Méthode Airtel Money RDC indisponible actuellement." }, { status: 400 });
    }
    const expectedAmount = planPrice(normalizedPlan, settings);
    if (Math.abs(expectedAmount - parsed.data.amount) > 0.001) {
      return NextResponse.json(
        { ok: false, error: "Montant incohérent avec le plan marketplace sélectionné." },
        { status: 400 },
      );
    }

    const proof = parsed.data.proofImageUrl.trim();
    if (proof) {
      const validUrl = z.string().url().safeParse(proof);
      if (!validUrl.success) {
        return NextResponse.json({ ok: false, error: "URL de capture invalide." }, { status: 400 });
      }
    }

    const created = await createBizapayPaymentRequest({
      businessId: business.id,
      userId: session.user.id,
      requestedPlan: normalizedPlan,
      paymentMethod: parsed.data.paymentMethod,
      payerPhoneNumber: parsed.data.payerPhoneNumber.trim(),
      amount: parsed.data.amount,
      currency: "USD",
      reference: `${parsed.data.reference.trim()}-${makeReference()}`,
      proofImageUrl: proof || null,
    });
    if (!created.ok) return NextResponse.json({ ok: false, error: created.error }, { status: 400 });

    return NextResponse.json({
      ok: true as const,
      message: "Demande envoyée au CEO. Validation en attente.",
      payment: created.payment,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erreur serveur lors de la création de la demande Bizapay." },
      { status: 500 },
    );
  }
}
