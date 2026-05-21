import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
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

function logBusinessCreateGuardRedirect(params: { hasSession: boolean; role: string; path: string }) {
  const enabled =
    process.env.NODE_ENV !== "production" || process.env.BUSINESS_CREATE_GUARD_DEBUG === "1";
  if (!enabled) return;
  console.warn(
    "[vc-business-create-guard]",
    JSON.stringify({
      ...params,
      vercelEnv: process.env.VERCEL_ENV,
    }),
  );
}

function redirectToLogin(callbackPath: string): never {
  const safe = getSafeInternalCallbackUrl(callbackPath, "/dashboard/business");
  redirect(`/login?callbackUrl=${encodeURIComponent(safe)}`);
}

/** CEO / agent : pas d’espace business classique. */
function redirectNonBusinessRoles(role: string | undefined) {
  if (isPlatformCeoRole(role)) redirect("/dashboard/ceo");
  if (role === "AGENT") redirect("/agent");
}

/**
 * Page création business : CLIENT, BUSINESS_OWNER sans vitrine, CEO plateforme.
 * AGENT → espace agent. Auth réelle : `guardBusinessCreatePage` (middleware ne bloque pas cette URL).
 */
export async function guardBusinessCreatePage() {
  const session = await getAuthSession();
  if (!session) {
    logBusinessCreateGuardRedirect({ hasSession: false, role: "none", path: "/dashboard/business/create" });
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
export async function guardBusinessOwnerArea(callbackPath = "/dashboard/business") {
  const session = await getAuthSession();
  if (!session) redirectToLogin(callbackPath);
  redirectNonBusinessRoles(session.user.role);

  if (session.user.role === "CLIENT") {
    redirect("/dashboard/business/create");
  }

  if (session.user.role !== "BUSINESS_OWNER") {
    redirect("/");
  }

  const n = await countOwnedBusinesses(session.user.id);
  if (n === 0) {
    redirect("/dashboard/business/create");
  }

  return session;
}
