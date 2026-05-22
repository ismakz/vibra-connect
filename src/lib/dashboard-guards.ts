import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { isPlatformCeoRole } from "@/lib/ceo-platform";

import { getSafeInternalCallbackUrl } from "./safe-callback-url";

function redirectToLogin(callbackPath: string): never {
  const safe = getSafeInternalCallbackUrl(callbackPath, "/");
  redirect(`/login?callbackUrl=${encodeURIComponent(safe)}`);
}

/**
 * Garde serveur dashboard business — source de vérité (pas le JWT Edge).
 * À appeler depuis le layout `/dashboard/business`.
 */
export async function guardBusinessDashboard() {
  const session = await getAuthSession();

  console.log("[business-dashboard-session]", {
    exists: !!session,
    role: session?.user?.role ?? null,
  });

  if (!session?.user?.id) {
    redirectToLogin("/dashboard/business");
  }

  const role = session.user.role;

  if (isPlatformCeoRole(role)) {
    redirect("/dashboard/ceo");
  }

  if (role === "AGENT") {
    redirect("/agent");
  }

  if (role === "CLIENT") {
    const h = await headers();
    const pathname = h.get("x-middleware-pathname") ?? "";
    if (!pathname.startsWith("/dashboard/business/create")) {
      redirect("/dashboard/business/create");
    }
  }

  if (role !== "BUSINESS_OWNER") {
    redirect("/");
  }

  return session;
}

/**
 * Garde serveur CEO Command Center — source de vérité (pas le JWT Edge).
 * À appeler depuis le layout `/dashboard/ceo`.
 */
export async function guardCeoDashboard() {
  const session = await getAuthSession();

  console.log("[ceo-dashboard-session]", {
    exists: !!session,
    role: session?.user?.role ?? null,
  });

  if (!session?.user?.id) {
    redirectToLogin("/dashboard/ceo");
  }

  const role = session.user.role;

  if (isPlatformCeoRole(role)) {
    return session;
  }

  if (role === "BUSINESS_OWNER") {
    redirect("/dashboard/business");
  }

  if (role === "AGENT") {
    redirect("/agent");
  }

  redirect("/");
}
