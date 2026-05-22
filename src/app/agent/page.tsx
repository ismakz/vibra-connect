import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Medal, TrendingUp } from "lucide-react";

import { AgentDashboardNav } from "@/components/dashboard/agent-dashboard-nav";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "AGENT") redirect("/");

  const [profile, leaderboard, paidSum] = await Promise.all([
    prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        commissions: true,
        user: { select: { email: true, name: true } },
        city: { select: { name: true } },
        referredBusinesses: {
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, name: true, slug: true, status: true },
        },
        _count: { select: { referredBusinesses: true } },
      },
    }),
    prisma.agentProfile.findMany({
      orderBy: { totalRecruited: "desc" },
      take: 8,
      include: { user: { select: { email: true } } },
    }),
    prisma.commission.aggregate({
      where: { agentProfile: { userId: session.user.id }, isPaid: true },
      _sum: { amount: true },
    }),
  ]);

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "") || "";
  const code = profile?.code ?? "";
  const referralLink = code ? `${baseUrl}/register?ref=${encodeURIComponent(code)}` : "";

  const myPaid = paidSum._sum.amount ? Number(paidSum._sum.amount) : 0;
  const commissionPct = profile?.commissionRate != null ? Number(profile.commissionRate) : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 text-white">
      <AgentDashboardNav />
      <section className="glass rounded-2xl border border-white/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">Espace agent</p>
        <h1 className="mt-2 text-3xl font-black">Mon parrainage</h1>
        <p className="mt-2 text-sm text-white/70">Partagez votre lien, suivez les business référés et vos commissions.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/55">Code agent</p>
            <p className="mt-1 font-mono text-lg font-bold text-cyan-200">{code || "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/55">Commission plateforme</p>
            <p className="mt-1 text-2xl font-black text-violet-200">
              {commissionPct != null && Number.isFinite(commissionPct) ? `${commissionPct} %` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/55">Business référés</p>
            <p className="mt-1 text-2xl font-black">{profile?._count.referredBusinesses ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/55">Commissions payées (cumul)</p>
            <p className="mt-1 text-2xl font-black text-emerald-200">{myPaid.toLocaleString("fr-FR")} USD</p>
          </div>
        </div>

        {profile?.city?.name ? (
          <p className="mt-3 text-xs text-white/45">
            Ville agent (profil) : <span className="text-white/70">{profile.city.name}</span>
          </p>
        ) : null}

        {referralLink ? (
          <div className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <p className="text-xs font-semibold text-cyan-100/90">Lien de parrainage</p>
            <code className="mt-2 block truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-white/90">{referralLink}</code>
            <p className="mt-2 text-xs text-white/55">
              Copiez ce lien pour inviter des business sur VIBRA CONNECT (paramètre <span className="font-mono">ref</span>).
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-200/90">Profil agent incomplet — contactez le support Bizaflow.</p>
        )}

        {profile && profile.referredBusinesses.length > 0 ? (
          <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-300/90" aria-hidden />
              <h2 className="text-sm font-bold text-white/90">Vos business référés (aperçu)</h2>
            </div>
            <ul className="mt-3 divide-y divide-white/10">
              {profile.referredBusinesses.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <Link href={`/b/${b.slug}`} className="font-medium text-cyan-200 hover:underline">
                    {b.name}
                  </Link>
                  <span className="text-xs text-white/50">{b.status}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/agent/referrals"
              className="mt-3 inline-block text-xs font-semibold text-cyan-300/90 hover:underline"
            >
              Voir tous les business référés →
            </Link>
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/agent/referrals"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:border-cyan-400/35"
          >
            Business référés
          </Link>
          <Link
            href="/agent/commissions"
            className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Commissions & paiements
          </Link>
          <Link href="/explore" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-violet-400/35">
            Voir la marketplace
          </Link>
        </div>
      </section>

      <section className="glass mt-6 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-bold">Leaderboard agents</h2>
        </div>
        <p className="mt-1 text-sm text-white/65">Classement par nombre de référés (données Prisma).</p>
        <ul className="mt-4 space-y-2">
          {leaderboard.map((row, idx) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="truncate text-white/90">{row.user.email}</span>
                {row.userId === session.user.id && (
                  <span className="shrink-0 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                    Vous
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1 font-semibold text-cyan-200">
                <TrendingUp className="h-3.5 w-3.5" />
                {row.totalRecruited}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
