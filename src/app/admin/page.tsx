import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/");

  const [businesses, users, agents, views, clicks] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.agentProfile.count(),
    prisma.businessViewEvent.count(),
    prisma.contactClickEvent.count(),
  ]);
  const [linkedBizaflow, unlinkedBizaflow, pendingPayments] = await Promise.all([
    prisma.business.count({ where: { integrationStatus: "LINKED" } }),
    prisma.business.count({ where: { integrationStatus: { in: ["NOT_LINKED", "PENDING", "ERROR"] } } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">CEO — Console Bizaflow</h1>
        <Link
          href="/dashboard/ceo"
          className="rounded-full bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_24px_rgba(139,92,246,0.35)]"
        >
          CEO Command Center
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="glass rounded-xl p-3 text-sm">Business: {businesses}</div>
        <div className="glass rounded-xl p-3 text-sm">Utilisateurs: {users}</div>
        <div className="glass rounded-xl p-3 text-sm">Agents: {agents}</div>
        <div className="glass rounded-xl p-3 text-sm">Vues: {views}</div>
        <div className="glass rounded-xl p-3 text-sm">Clics: {clicks}</div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="glass rounded-xl p-3 text-sm">Bizaflow liés: {linkedBizaflow}</div>
        <div className="glass rounded-xl p-3 text-sm">Bizaflow non liés: {unlinkedBizaflow}</div>
        <div className="glass rounded-xl p-3 text-sm">Paiements à valider: {pendingPayments}</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/businesses" className="rounded-full bg-cyan-500 px-3 py-1 text-black">Business</Link>
        <Link href="/admin/categories" className="rounded-full border border-white/20 px-3 py-1">Categories</Link>
        <Link href="/admin/cities" className="rounded-full border border-white/20 px-3 py-1">Villes</Link>
        <Link href="/admin/agents" className="rounded-full border border-white/20 px-3 py-1">Agents</Link>
        <Link href="/admin/subscriptions" className="rounded-full border border-white/20 px-3 py-1">Abonnements</Link>
        <Link href="/admin/reports" className="rounded-full border border-white/20 px-3 py-1">Signalements</Link>
      </div>
    </main>
  );
}
