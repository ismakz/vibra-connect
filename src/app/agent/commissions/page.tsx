import Link from "next/link";
import { redirect } from "next/navigation";

import { AgentDashboardNav } from "@/components/dashboard/agent-dashboard-nav";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentCommissionsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "AGENT") redirect("/");

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      commissions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  const paid = profile?.commissions.filter((c) => c.isPaid) ?? [];
  const pending = profile?.commissions.filter((c) => !c.isPaid) ?? [];
  const paidTotal = paid.reduce((s, c) => s + Number(c.amount), 0);
  const pendingTotal = pending.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 text-white">
      <AgentDashboardNav />
      <section className="glass rounded-2xl border border-white/10 p-6">
        <h1 className="text-2xl font-black">Commissions</h1>
        <p className="mt-2 text-sm text-white/70">Historique des commissions liées à vos business référés.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <p className="text-xs text-white/55">Payées</p>
            <p className="mt-1 text-2xl font-black text-emerald-200">{paidTotal.toLocaleString("fr-FR")} USD</p>
          </div>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4">
            <p className="text-xs text-white/55">En attente</p>
            <p className="mt-1 text-2xl font-black text-amber-200">{pendingTotal.toLocaleString("fr-FR")} USD</p>
          </div>
        </div>

        {profile?.commissions.length ? (
          <ul className="mt-6 space-y-2 text-sm">
            {profile.commissions.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <span>
                  {Number(c.amount).toLocaleString("fr-FR")} USD — {c.createdAt.toLocaleDateString("fr-FR")}
                </span>
                <span
                  className={
                    c.isPaid
                      ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-100"
                      : "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100"
                  }
                >
                  {c.isPaid ? "Payée" : "En attente"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-white/60">Aucune commission pour le moment. Partagez votre lien de parrainage.</p>
        )}

        <Link href="/agent" className="mt-6 inline-flex text-sm text-cyan-200 hover:underline">
          ← Retour à mon espace agent
        </Link>
      </section>
    </main>
  );
}
