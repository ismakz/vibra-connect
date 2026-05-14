import { BusinessStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ status: z.nativeEnum(BusinessStatus), verified: z.boolean().optional() });

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Action non autorisee." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Donnees invalides." }, { status: 400 });
  }

  await prisma.business.update({
    where: { id },
    data: { status: parsed.data.status, verified: parsed.data.verified },
  });
  return NextResponse.json({ message: "Business mis a jour." });
}
