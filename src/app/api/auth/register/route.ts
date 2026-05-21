import { NextResponse } from "next/server";

import { registerNewUser } from "@/lib/server/register-user";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, message: "Corps JSON invalide." }, { status: 400 });
  }

  const result = await registerNewUser(json);
  if (!result.ok) {
    return NextResponse.json({ ok: false as const, message: result.message }, { status: result.status });
  }

  return NextResponse.json(
    {
      ok: true as const,
      message: "Compte créé avec succès.",
      email: result.email,
      invitedByValidAgent: result.invitedByValidAgent,
      refProvidedButInvalid: result.refProvidedButInvalid,
    },
    { status: 201 },
  );
}
