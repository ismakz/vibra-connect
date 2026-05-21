import { NextResponse } from "next/server";

import { registerNewUser } from "@/lib/server/register-user";

/** @deprecated Préférez `POST /api/auth/register` — conservé pour compatibilité. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ message: "Corps JSON invalide." }, { status: 400 });
  }

  if (
    json &&
    typeof json === "object" &&
    !("confirmPassword" in json) &&
    "password" in json &&
    typeof (json as { password: unknown }).password === "string"
  ) {
    const o = json as Record<string, unknown>;
    json = { ...o, confirmPassword: o.password };
  }

  const result = await registerNewUser(json);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json(
    {
      message: "Compte créé avec succès.",
      referralMessage: result.refProvidedButInvalid
        ? "Code agent introuvable : inscription sans parrainage."
        : result.invitedByValidAgent
          ? "Inscription avec agent partenaire confirmée."
          : undefined,
    },
    { status: 201 },
  );
}
