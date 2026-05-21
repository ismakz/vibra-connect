"use client";

import { motion } from "framer-motion";
import {
  Building2,
  CreditCard,
  Eye,
  Flame,
  MousePointerClick,
  Percent,
  Users,
  UserSquare2,
  Wallet,
} from "lucide-react";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function CeoKpiStrip(props: {
  kpis: {
    totalUsers: number;
    totalBusinesses: number;
    activeBusinesses: number;
    activeSubscriptions: number;
    revenueApproved: number;
    activeAgents: number;
    businessViews: number;
    whatsappClicks: number;
    conversionRate: number;
    activeUrgentSales: number;
  };
}) {
  const k = props.kpis;
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const money = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " USD";

  const cards = [
    { icon: Users, label: "Utilisateurs", value: fmt(k.totalUsers), sub: "total plateforme" },
    { icon: Building2, label: "Business", value: fmt(k.totalBusinesses), sub: `${fmt(k.activeBusinesses)} actifs` },
    { icon: CreditCard, label: "Abonnements actifs", value: fmt(k.activeSubscriptions), sub: "business (statut)" },
    { icon: Wallet, label: "Revenus approuvés", value: money(k.revenueApproved), sub: "paiements Bizapay & co." },
    { icon: UserSquare2, label: "Agents", value: fmt(k.activeAgents), sub: "comptes rôle AGENT" },
    { icon: Eye, label: "Vues vitrine", value: fmt(k.businessViews), sub: "événements vues" },
    { icon: MousePointerClick, label: "Clics WhatsApp", value: fmt(k.whatsappClicks), sub: "contacts" },
    { icon: Percent, label: "Taux conversion", value: `${k.conversionRate} %`, sub: "clics WA / vues" },
    { icon: Flame, label: "Ventes urgentes", value: fmt(k.activeUrgentSales), sub: "actives marketplace" },
  ];

  return (
    <motion.div
      id="kpis"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((c) => (
        <motion.div key={c.label} variants={item}>
          <DashboardGlassCard hover className="h-full p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-white/55">{c.label}</p>
                <p className="mt-1 text-2xl font-black text-white">{c.value}</p>
                <p className="mt-1 text-xs text-cyan-200/80">{c.sub}</p>
              </div>
              <c.icon className="h-8 w-8 shrink-0 text-cyan-300/50" aria-hidden />
            </div>
          </DashboardGlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
