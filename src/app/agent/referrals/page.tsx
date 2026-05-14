import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentReferralsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "AGENT") redirect("/");

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, code: true },
  });
  if (!agentProfile) redirect("/agent");

  const referrals = await prisma.business.findMany({
    where: { referralAgentId: agentProfile.id },
    include: {
      city: { select: { name: true } },
      category: { select: { name: true } },
      owner: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-white">
      <section className="glass rounded-2xl border border-white/10 p-6">
        <h1 className="text-2xl font-black">Business referes</h1>
        <p className="mt-2 text-sm text-white/70">
          Code agent: <span className="font-mono text-cyan-200">{agentProfile.code}</span> · {referrals.length} business rattache(s)
        </p>
        {referrals.length === 0 ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Aucun business référé pour l&apos;instant. Partagez votre lien `/register?ref={agentProfile.code}`.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                <tr>
                  <th className="px-3 py-2">Business</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Ville</th>
                  <th className="px-3 py-2">Categorie</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((b) => (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="px-3 py-2">
                      <Link href={`/b/${b.slug}`} className="text-cyan-200 hover:underline">
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-white/80">{b.owner.email}</td>
                    <td className="px-3 py-2">{b.city.name}</td>
                    <td className="px-3 py-2">{b.category.name}</td>
                    <td className="px-3 py-2">{b.status}</td>
                    <td className="px-3 py-2 text-white/60">{b.createdAt.toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
