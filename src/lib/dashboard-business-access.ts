import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { guardBusinessDashboard } from "@/lib/dashboard-guards";
import { isPlatformCeoRole } from "@/lib/ceo-platform";
import { prisma } from "@/lib/prisma";

import { getSafeInternalCallbackUrl } from "./safe-callback-url";

async function countOwnedBusinesses(userId: string): Promise<number> {
  try {
    return await prisma.business.count({ where: { ownerId: userId } });
  } catch {
    return 0;
  }
}

function logBusinessCreateGuardRedirect() {
  /* logs désactivés */
}

function redirectToLogin(callbackPath: string): never {
  const safe = getSafeInternalCallbackUrl(callbackPath, "/dashboard/business");
  redirect(`/login?callbackUrl=${encodeURIComponent(safe)}`);
}

/**
 * Page création business : CLIENT, BUSINESS_OWNER sans vitrine, CEO plateforme.
 * AGENT → espace agent. Auth réelle : `guardBusinessCreatePage` (middleware ne bloque pas cette URL).
 */
export async function guardBusinessCreatePage() {
  const session = await getAuthSession();
  if (!session) {
    logBusinessCreateGuardRedirect();
    redirectToLogin("/dashboard/business/create");
  }

  const role = session.user.role;
  if (role === "AGENT") {
    redirect("/agent");
  }

  if (role === "BUSINESS_OWNER") {
    const n = await countOwnedBusinesses(session.user.id);
    if (n > 0) redirect("/dashboard/business");
  }

  const allowed =
    role === "CLIENT" || role === "BUSINESS_OWNER" || isPlatformCeoRole(role);
  if (!allowed) {
    redirect("/");
  }

  return session;
}

/**
 * Dashboard business propriétaire (index + sous-routes).
 */
export async function guardBusinessOwnerArea() {
  const session = await guardBusinessDashboard();

  const n = await countOwnedBusinesses(session.user.id);
  if (n === 0) {
    redirect("/dashboard/business/create");
  }

  return session;
}
