import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { type NextRequestWithAuth, withAuth } from "next-auth/middleware";

import { isPlatformCeoRole } from "@/lib/ceo-platform";

/** Routes accessibles sans session (SSR + fetch client landing / marketplace). */
function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/logout") return true;
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/register" || pathname.startsWith("/register/")) return true;
  if (pathname === "/pricing" || pathname.startsWith("/pricing/")) return true;
  if (pathname.startsWith("/explore")) return true;
  if (pathname.startsWith("/b/")) return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.startsWith("/api/locations")) return true;
  if (pathname.startsWith("/api/explore")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/register")) return true;
  if (pathname.startsWith("/api/businesses")) return true;
  if (pathname === "/manifest.webmanifest") return true;
  if (pathname === "/sw.js") return true;
  return false;
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
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // NextAuth lie CSRF / cookies à l'hôte : si NEXTAUTH_URL=localhost mais que le
  // navigateur ouvre 127.0.0.1, la connexion échoue (souvent « Configuration »).
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

  if (isPublicRoute(p)) {
    return NextResponse.next();
  }

  const needsAuth =
    p.startsWith("/dashboard") ||
    p.startsWith("/admin") ||
    p.startsWith("/agent") ||
    p.startsWith("/api/ceo") ||
    p.startsWith("/api/dashboard") ||
    p.startsWith("/api/user") ||
    p.startsWith("/profile") ||
    p.startsWith("/notifications") ||
    p === "/api/auth/error";

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Création business : pas d’exigence JWT côté Edge (withAuth). La page serveur
  // applique `guardBusinessCreatePage` — évite les faux /login en prod quand le
  // cookie session est lisible par Node mais pas décodé correctement en middleware.
  if (p === "/dashboard/business/create" || p.startsWith("/dashboard/business/create/")) {
    return NextResponse.next();
  }

  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
