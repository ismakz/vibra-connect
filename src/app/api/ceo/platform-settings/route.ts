import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { isPlatformCeoRole } from "@/lib/ceo-platform";
import {
  FALLBACK_PLATFORM_SETTINGS,
  getPlatformSettings,
  upsertPlatformSettings,
} from "@/lib/platform-settings";

const settingsSchema = z.object({
  defaultAgentCommission: z.coerce.number().min(0).max(100),
  freePlanPrice: z.coerce.number().min(0).max(100000),
  standardPlanPrice: z.coerce.number().min(0).max(100000),
  premiumPlanPrice: z.coerce.number().min(0).max(100000),
  sponsoredPlanPrice: z.coerce.number().min(0).max(100000),
  maxProductsFree: z.coerce.number().int().min(1).max(10000),
  maxProductsStandard: z.coerce.number().int().min(1).max(10000),
  maxProductsPremium: z.coerce.number().int().min(1).max(10000),
  maxGalleryImages: z.coerce.number().int().min(1).max(200),
  sponsoredBoostLevel: z.coerce.number().int().min(1).max(20),
  maintenanceMode: z.coerce.boolean(),
  mtnMomoRwandaNumber: z.string().min(6).max(40),
  mtnMomoRwandaCountry: z.string().min(2).max(40),
  mtnMomoRwandaCurrency: z.string().min(2).max(20),
  mtnMomoRwandaEnabled: z.coerce.boolean(),
  airtelMoneyRdcNumber: z.string().min(6).max(40),
  airtelMoneyRdcCountry: z.string().min(2).max(40),
  airtelMoneyRdcCurrency: z.string().min(2).max(20),
  airtelMoneyRdcEnabled: z.coerce.boolean(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session || !isPlatformCeoRole(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 });
  }
  const settings = await getPlatformSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session || !isPlatformCeoRole(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Données invalides.";
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  try {
    const settings = await upsertPlatformSettings(parsed.data);
    return NextResponse.json({ ok: true, settings, fallback: FALLBACK_PLATFORM_SETTINGS });
  } catch (e) {
    console.error("[ceo/platform-settings] PATCH", e);
    return NextResponse.json({ ok: false, error: "Impossible de sauvegarder la configuration." }, { status: 500 });
  }
}

