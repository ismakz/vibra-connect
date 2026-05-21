import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { type NextRequestWithAuth, withAuth } from "next-auth/middleware";

import { isPlatformCeoRole } from "@/lib/ceo-platform";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

/** Routes publiques — accessibles sans session (pas de withAuth). */
function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/explore")) return true;
  if (pathname.startsWith("/b/")) return true;
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/register" || pathname.startsWith("/register/")) return true;
  if (pathname === "/pricing" || pathname.startsWith("/pricing/")) return true;
  if (pathname === "/tarifs" || pathname.startsWith("/tarifs/")) return true;
  if (pathname === "/logout") return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname === "/manifest.webmanifest") return true;
  if (pathname === "/sw.js") return true;
  if (pathname.startsWith("/api/locations")) return true;
  if (pathname.startsWith("/api/explore")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/register")) return true;
  if (pathname.startsWith("/api/businesses")) return true;
  return false;
}

/** Routes protégées — withAuth + règles de rôle. */
function requiresAuth(pathname: string): boolean {
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/profile")) return true;
  if (pathname.startsWith("/notifications")) return true;
  if (pathname.startsWith("/agent")) return true;
  if (pathname.startsWith("/api/user")) return true;
  if (pathname.startsWith("/api/dashboard")) return true;
  // Espace plateforme CEO (hors spec landing, toujours privé)
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/ceo")) return true;
  if (pathname === "/api/auth/error") return true;
  return false;
}

/** Création business : auth vérifiée côté serveur (guard), pas JWT Edge. */
function isBusinessCreateRoute(pathname: string): boolean {
  return pathname === "/dashboard/business/create" || pathname.startsWith("/dashboard/business/create/");
}

async function logMiddlewareAuth(req: NextRequest) {
  const enabled = process.env.NODE_ENV === "development" || process.env.DEBUG_AUTH === "1";
  if (!enabled) return;
  const token = await getToken({ req, secret: AUTH_SECRET });
  console.log(
    "[middleware]",
    JSON.stringify({
      path: req.nextUrl.pathname,
      authenticated: Boolean(token),
      role: (token?.role as string | undefined) ?? null,
    }),
  );
}

const authMiddleware = withAuth(
  function middleware(req) {
    if (req.nextUrl.pathname === "/api/auth/error") {
      const error = req.nextUrl.searchParams.get("error") ?? "Configuration";
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", error);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    secret: AUTH_SECRET,
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized({ req, token }) {
        if (req.nextUrl.pathname === "/api/auth/error") return true;
        if (!token) return false;
        const role = token.role as string | undefined;
        const p = req.nextUrl.pathname;
        if (p.startsWith("/dashboard/ceo")) return isPlatformCeoRole(role);
        if (p.startsWith("/api/ceo")) return isPlatformCeoRole(role);
        if (p.startsWith("/admin")) return isPlatformCeoRole(role);
        if (p.startsWith("/agent") || p.startsWith("/dashboard/agent")) return role === "AGENT";
        return true;
      },
    },
  },
);

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (process.env.NODE_ENV === "development") {
    const host = req.headers.get("host") ?? "";
    if (host.startsWith("127.0.0.1")) {
      const url = req.nextUrl.clone();
      url.hostname = "localhost";
      return NextResponse.redirect(url, 307);
    }
  }

  const p = req.nextUrl.pathname;

  if (p === "/dashboard/super-admin" || p.startsWith("/dashboard/super-admin/")) {
    const url = req.nextUrl.clone();
    url.pathname = p.replace(/^\/dashboard\/super-admin/, "/dashboard/ceo");
    return NextResponse.redirect(url, 308);
  }
  if (p.startsWith("/api/super-admin")) {
    const url = req.nextUrl.clone();
    url.pathname = p.replace(/^\/api\/super-admin/, "/api/ceo");
    return NextResponse.redirect(url, 308);
  }

  if (p === "/explorer" || p.startsWith("/explorer/")) {
    const url = req.nextUrl.clone();
    url.pathname = p.replace(/^\/explorer/, "/explore");
    return NextResponse.redirect(url, 308);
  }

  if (p === "/pricing") {
    const url = req.nextUrl.clone();
    url.pathname = "/tarifs";
    return NextResponse.redirect(url, 308);
  }

  await logMiddlewareAuth(req);

  if (isPublicRoute(p)) {
    return NextResponse.next();
  }

  if (!requiresAuth(p)) {
    return NextResponse.next();
  }

  if (isBusinessCreateRoute(p)) {
    return NextResponse.next();
  }

  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
