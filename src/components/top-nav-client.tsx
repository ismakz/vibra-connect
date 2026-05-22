"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/user-avatar";
import { isPlatformCeoRole } from "@/lib/ceo-platform";
import {
  dashboardHrefForRole,
  EXPLORE_MARKET_HREF,
  navBusinessLinkLabel,
  navRoleBadge,
} from "@/lib/nav-user";

export type TopNavUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
};

function ProfileMenu({ navUser }: { navUser: TopNavUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const dash = dashboardHrefForRole(navUser.role);
  const roleLabel = navRoleBadge(navUser.role);
  const displayName = navUser.name?.trim() || navUser.email?.split("@")[0] || "Compte";

  const itemClass =
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-2.5 text-left text-sm shadow-[0_0_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:border-cyan-400/35 hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar name={navUser.name} email={navUser.email} avatarUrl={navUser.avatarUrl} size={34} />
        <span className="hidden max-w-[140px] flex-col sm:flex">
          <span className="truncate font-semibold text-white">{displayName}</span>
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-cyan-200/90">{roleLabel}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 w-64 rounded-2xl border border-white/15 bg-[#0a1024]/90 p-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="border-b border-white/10 px-2 py-2 sm:hidden">
            <p className="truncate font-semibold text-white">{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/90">{roleLabel}</p>
          </div>
          <Link href="/profile" className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
            <User className="h-4 w-4 text-cyan-300" />
            Mon profil
          </Link>
          <Link href={dash} className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4 text-violet-300" />
            Mon espace
          </Link>
          <Link href="/profile/edit" className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4 text-white/70" />
            Paramètres
          </Link>
          <Link href="/notifications" className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
            <Bell className="h-4 w-4 text-amber-200/90" />
            Notifications
          </Link>
          <Link href="/logout" className={`${itemClass} text-rose-200 hover:text-rose-100`} role="menuitem" onClick={() => setOpen(false)}>
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function TopNavClient({
  navUser,
  businessHref,
  isAuthenticated,
}: {
  navUser: TopNavUser | null;
  businessHref: string;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  const businessNavLabel = navBusinessLinkLabel(navUser?.role, isAuthenticated);

  const links: Array<{ href: string; label: string }> = [
    { href: "/", label: "Accueil" },
    { href: EXPLORE_MARKET_HREF, label: "Marketplace" },
  ];

  if (businessNavLabel) {
    links.push({ href: businessHref, label: businessNavLabel });
  }

  links.push({ href: "/tarifs", label: "Tarifs" });

  const publishLabel =
    !isAuthenticated || navUser?.role === "CLIENT"
      ? "Publier mon business"
      : navUser?.role === "BUSINESS_OWNER"
        ? "Mon business"
        : isPlatformCeoRole(navUser?.role ?? "")
          ? "Pilotage plateforme"
          : navUser?.role === "AGENT"
            ? "Espace agent"
            : "Publier mon business";

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/70 backdrop-blur-xl"
      data-nav-authenticated={isAuthenticated ? "1" : "0"}
      data-nav-role={navUser?.role ?? "guest"}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
          <span className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="VIBRA CONNECT"
              width={40}
              height={40}
              priority
              className="h-10 w-10 shrink-0 rounded-full object-contain"
            />
            <span className="truncate text-sm font-bold tracking-[0.18em] text-white">VIBRA CONNECT</span>
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40 sm:inline">
            Marketplace Afrique
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-white/75 lg:flex xl:gap-7" aria-label="Navigation principale">
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href} className="whitespace-nowrap transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-2 lg:gap-3">
          {isAuthenticated && navUser ? (
            <ProfileMenu navUser={navUser} />
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-4 py-2 text-sm whitespace-nowrap"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 shadow-[0_0_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:border-cyan-400/35 hover:bg-white/10 whitespace-nowrap"
              >
                Créer un compte
              </Link>
            </>
          )}
          <Link
            href={businessHref}
            className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-black whitespace-nowrap hover:from-violet-500 hover:to-cyan-400"
          >
            {publishLabel}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-white/20 p-2 md:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden border-t border-white/10 md:hidden"
      >
        <div className="space-y-2 px-4 py-3">
          {isAuthenticated && navUser ? (
            <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <UserAvatar name={navUser.name} email={navUser.email} avatarUrl={navUser.avatarUrl} size={44} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{navUser.name?.trim() || navUser.email?.split("@")[0]}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/90">{navRoleBadge(navUser.role)}</p>
              </div>
            </div>
          ) : null}
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block min-h-[44px] rounded-lg bg-white/5 px-3 py-2.5 text-sm leading-[44px]"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && navUser ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className="block min-h-[44px] rounded-lg bg-white/5 px-3 py-2.5 text-sm">
                Mon profil
              </Link>
              <Link
                href={dashboardHrefForRole(navUser.role)}
                onClick={() => setOpen(false)}
                className="block min-h-[44px] rounded-lg bg-white/5 px-3 py-2.5 text-sm"
              >
                Mon espace
              </Link>
              <Link href="/profile/edit" onClick={() => setOpen(false)} className="block min-h-[44px] rounded-lg bg-white/5 px-3 py-2.5 text-sm">
                Paramètres
              </Link>
              <Link href="/notifications" onClick={() => setOpen(false)} className="block min-h-[44px] rounded-lg bg-white/5 px-3 py-2.5 text-sm">
                Notifications
              </Link>
              <Link
                href="/logout"
                onClick={() => setOpen(false)}
                className="block min-h-[44px] rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
              >
                Déconnexion
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block min-h-[44px] rounded-lg border border-white/20 px-3 py-2.5 text-sm">
                Connexion
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="block min-h-[44px] rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/90"
              >
                Créer un compte
              </Link>
            </>
          )}
          <Link
            href={businessHref}
            onClick={() => setOpen(false)}
            className="block min-h-[44px] rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-2.5 text-center text-sm font-semibold text-black"
          >
            {publishLabel}
          </Link>
        </div>
      </motion.div>
    </header>
  );
}
