import { ContactType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  type: z.nativeEnum(ContactType),
  target: z.string().min(2),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.contactClickEvent.create({
    data: {
      businessId: id,
      type: parsed.data.type,
      source: "public_page",
    },
  });

  return NextResponse.json({ ok: true });
}
