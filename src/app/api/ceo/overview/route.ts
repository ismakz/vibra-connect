import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { getCeoCommandCenterOverview } from "@/lib/ceo-queries";
import { isPlatformCeoRole } from "@/lib/ceo-platform";

export async function GET() {
  const session = await getAuthSession();
  if (!session || !isPlatformCeoRole(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 });
  }

  const overview = await getCeoCommandCenterOverview();
  return NextResponse.json(overview);
}
