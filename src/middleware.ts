import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { type NextRequestWithAuth, withAuth } from "next-auth/middleware";

import { isPlatformCeoRole } from "@/lib/ceo-platform";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
] as const;

/** Routes publiques — accessibles sans session. */
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

/**
 * Dashboards sensibles : le middleware ne redirige jamais vers /login.
 * La session est confirmée côté serveur (getServerSession) dans les layouts.
 */
function isServerGuardedRoute(pathname: string): boolean {
  if (pathname.startsWith("/dashboard/business")) return true;
  if (pathname.startsWith("/dashboard/ceo")) return true;
  if (pathname.startsWith("/dashboard/agent")) return true;
  if (pathname.startsWith("/agent")) return true;
  if (pathname.startsWith("/profile")) return true;
  return false;
}

/** Autres routes protégées — contrôle Edge rapide (peut compléter côté API/page). */
function requiresEdgeAuth(pathname: string): boolean {
  if (pathname.startsWith("/notifications")) return true;
  if (pathname.startsWith("/api/user")) return true;
  if (pathname.startsWith("/api/dashboard")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/ceo")) return true;
  if (pathname === "/api/auth/error") return true;
  return false;
}

function hasNextAuthSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

async function logMiddlewareAuth(req: NextRequest, extra?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    cookieName: sessionCookieName(),
  });
  console.log(
    "[middleware]",
    JSON.stringify({
      path: req.nextUrl.pathname,
      hasSessionCookie: hasNextAuthSessionCookie(req),
      edgeToken: Boolean(token),
      edgeRole: (token?.role as string | undefined) ?? null,
      ...extra,
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
        if (p.startsWith("/api/ceo")) return isPlatformCeoRole(role);
        if (p.startsWith("/admin")) return isPlatformCeoRole(role);
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

  if (isPublicRoute(p)) {
    return NextResponse.next();
  }

  /** Dashboards : toujours laisser passer — auth réelle dans les layouts serveur. */
  if (isServerGuardedRoute(p)) {
    await logMiddlewareAuth(req, { serverGuarded: true });
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-middleware-pathname", p);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!requiresEdgeAuth(p)) {
    return NextResponse.next();
  }

  /**
   * API / notifications : si cookie session présent mais JWT Edge illisible,
   * laisser passer quand même (routes API vérifient getServerSession).
   */
  if (hasNextAuthSessionCookie(req)) {
    const token = await getToken({
      req,
      secret: AUTH_SECRET,
      cookieName: sessionCookieName(),
    });
    if (!token) {
      await logMiddlewareAuth(req, { cookieFallback: true });
      return NextResponse.next();
    }
  }

  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
