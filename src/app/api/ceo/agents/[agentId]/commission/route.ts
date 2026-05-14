import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { isPlatformCeoRole } from "@/lib/ceo-platform";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  commissionRate: z.coerce.number().min(0).max(100),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await getAuthSession();
  if (!session || !isPlatformCeoRole(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 });
  }

  const { agentId } = await params;
  if (!agentId) {
    return NextResponse.json({ ok: false, error: "Agent invalide." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Données invalides.";
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  try {
    const updated = await prisma.agentProfile.update({
      where: { id: agentId },
      data: { commissionRate: parsed.data.commissionRate },
      select: { id: true, commissionRate: true },
    });
    return NextResponse.json({
      ok: true,
      agentId: updated.id,
      commissionRate: Number(updated.commissionRate),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Agent introuvable ou mise à jour impossible." }, { status: 404 });
  }
}

