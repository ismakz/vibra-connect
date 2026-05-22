"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard/business", label: "Vue d'ensemble", match: (p: string) => p === "/dashboard/business" },
  { href: "/dashboard/business/edit", label: "Profil business", match: (p: string) => p.startsWith("/dashboard/business/edit") },
  { href: "/dashboard/business/products", label: "Produits & services", match: (p: string) => p.startsWith("/dashboard/business/products") },
  { href: "/dashboard/business/promotions", label: "Promotions", match: (p: string) => p.startsWith("/dashboard/business/promotions") },
  { href: "/dashboard/business/subscription", label: "Abonnement", match: (p: string) => p.startsWith("/dashboard/business/subscription") },
  { href: "/dashboard/business/stats", label: "Statistiques", match: (p: string) => p.startsWith("/dashboard/business/stats") },
] as const;

export function BusinessDashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation espace business"
      className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5"
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm",
              active
                ? "bg-gradient-to-r from-violet-600/80 to-cyan-500/70 text-black"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
