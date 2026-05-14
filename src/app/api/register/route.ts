import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).optional(),
  ref: z.string().trim().min(2).max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Connexion impossible, verifiez vos informations." }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ message: "Email deja utilise." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const normalizedRef = parsed.data.ref?.trim().toUpperCase();
    const referralAgent =
      normalizedRef && (parsed.data.role ?? UserRole.BUSINESS_OWNER) === UserRole.BUSINESS_OWNER
        ? await prisma.agentProfile.findUnique({
            where: { code: normalizedRef },
            select: { id: true, userId: true },
          })
        : null;

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role ?? UserRole.BUSINESS_OWNER,
        referredByAgentId: referralAgent?.id,
      },
    });

    if (referralAgent && referralAgent.userId === user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { referredByAgentId: null },
      });
    }
    if (user.role === UserRole.AGENT) {
      await prisma.agentProfile.create({
        data: {
          userId: user.id,
          code: `AG-${user.id.slice(-6).toUpperCase()}`,
        },
      });
    }
    const referralMessage =
      normalizedRef && !referralAgent
        ? "Code agent invalide : inscription poursuivie sans rattachement."
        : referralAgent
          ? "Inscription avec agent partenaire confirmée."
          : undefined;
    return NextResponse.json({ message: "Compte cree avec succes.", referralMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Connexion impossible, verifiez vos informations." }, { status: 500 });
  }
}
