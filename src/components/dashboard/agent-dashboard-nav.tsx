"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/agent", label: "Mon lien", match: (p: string) => p === "/agent" },
  { href: "/agent/referrals", label: "Business référés", match: (p: string) => p.startsWith("/agent/referrals") },
  { href: "/agent/commissions", label: "Commissions", match: (p: string) => p.startsWith("/agent/commissions") },
] as const;

export function AgentDashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation espace agent"
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
