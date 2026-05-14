import { randomBytes } from "crypto";

import bcrypt from "bcryptjs";
import { UserRole, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { CEO_DASHBOARD_PATH, isPlatformCeoRole } from "@/lib/ceo-platform";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

const createAgentSchema = z.object({
  fullName: z.string().min(2, "Nom trop court."),
  email: z.string().email("Email invalide."),
  phone: z
    .string()
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
  cityId: z.string().min(1, "Ville requise."),
  tempPassword: z.string().min(6, "Mot de passe : au moins 6 caractères."),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});

async function generateUniqueAgentCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt++) {
    const code = `VC-${randomBytes(4).toString("hex").toUpperCase()}`;
    const taken = await tx.agentProfile.findUnique({ where: { code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Impossible de générer un code agent unique.");
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session || !isPlatformCeoRole(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    const first = Object.values(msg).flat()[0] ?? "Données invalides.";
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  const { fullName, email, phone, cityId, tempPassword, commissionRate } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const platformSettings = await getPlatformSettings();
  const effectiveCommissionRate = commissionRate ?? platformSettings.defaultAgentCommission;

  const city = await prisma.city.findFirst({
    where: { id: cityId, isActive: true },
    select: { id: true },
  });
  if (!city) {
    return NextResponse.json({ ok: false, error: "Ville introuvable ou inactive." }, { status: 400 });
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "") || "";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { email: { equals: emailNorm, mode: "insensitive" } },
        include: {
          agentProfile: { select: { id: true, code: true } },
          businesses: { select: { id: true }, take: 1 },
        },
      });

      if (existing?.role === "SUPER_ADMIN") {
        return { type: "forbidden" as const };
      }

      if (existing?.agentProfile) {
        return { type: "already_agent" as const };
      }

      if (existing && existing.role === "BUSINESS_OWNER" && existing.businesses.length > 0) {
        return { type: "business_owner_conflict" as const };
      }

      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const code = await generateUniqueAgentCode(tx);
      const referralPath = `/register?ref=${encodeURIComponent(code)}`;
      const referralUrl = baseUrl ? `${baseUrl}${referralPath}` : referralPath;

      if (!existing) {
        const user = await tx.user.create({
          data: {
            name: fullName.trim(),
            email: emailNorm,
            passwordHash,
            role: UserRole.AGENT,
          },
        });
        await tx.agentProfile.create({
          data: {
            userId: user.id,
            code,
            referralLink: referralUrl,
            commissionRate: effectiveCommissionRate,
            phone: phone ?? null,
            cityId,
          },
        });
        return {
          type: "success" as const,
          createdNewUser: true,
          email: emailNorm,
          tempPassword,
          agentCode: code,
          referralUrl,
        };
      }

      await tx.user.update({
        where: { id: existing.id },
        data: {
          name: fullName.trim(),
          email: emailNorm,
          passwordHash,
          role: UserRole.AGENT,
        },
      });
      await tx.agentProfile.create({
        data: {
          userId: existing.id,
          code,
          referralLink: referralUrl,
          commissionRate: effectiveCommissionRate,
          phone: phone ?? null,
          cityId,
        },
      });
      return {
        type: "success" as const,
        createdNewUser: false,
        email: emailNorm,
        tempPassword,
        agentCode: code,
        referralUrl,
      };
    });

    if (result.type === "forbidden") {
      return NextResponse.json(
        { ok: false, error: "Ce compte administrateur ne peut pas être converti en agent." },
        { status: 403 },
      );
    }
    if (result.type === "already_agent") {
      return NextResponse.json(
        { ok: false, error: "Un agent existe déjà pour cet email." },
        { status: 409 },
      );
    }
    if (result.type === "business_owner_conflict") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Ce compte est déjà propriétaire d’au moins un établissement. Utilisez un autre email.",
        },
        { status: 409 },
      );
    }

    revalidatePath(CEO_DASHBOARD_PATH);
    return NextResponse.json({
      ok: true,
      email: result.email,
      tempPassword: result.tempPassword,
      agentCode: result.agentCode,
      referralUrl: result.referralUrl,
      createdNewUser: result.createdNewUser,
    });
  } catch (e) {
    console.error("[ceo/agents] POST", e);
    return NextResponse.json({ ok: false, error: "Erreur serveur lors de la création." }, { status: 500 });
  }
}
