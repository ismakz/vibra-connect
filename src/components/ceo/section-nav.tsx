"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const links = [
  { href: "#kpis", label: "KPIs" },
  { href: "#business", label: "Business" },
  { href: "#payments", label: "Paiements" },
  { href: "#agents", label: "Agents" },
  { href: "#users", label: "Utilisateurs" },
  { href: "#moderation", label: "Modération" },
  { href: "#platform-settings", label: "Configuration" },
  { href: "#analytics", label: "Statistiques" },
] as const;

export function CeoSectionNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Sections pilotage plateforme"
      className="glass sticky top-4 z-30 mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-violet-400/15 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(139,92,246,0.08)] sm:flex-wrap"
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-cyan-200 sm:text-sm"
        >
          {l.label}
        </Link>
      ))}
    </motion.nav>
  );
}
