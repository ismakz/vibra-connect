import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, Sparkles, User } from "lucide-react";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InviteAgentLandingPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-[#050816] px-4 py-14 text-white">
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300/90">Bizaflow · VIBRA CONNECT</p>
          <h1 className="text-3xl font-black tracking-tight">Espace invité agent</h1>
          <p className="text-sm text-white/70">
            Cette page accueille les membres parrainés par un agent partenaire. Connectez-vous pour continuer, ou créez un
            compte avec le lien qui vous a été envoyé.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:border-cyan-400/40"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-black"
            >
              Créer un compte
            </Link>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:underline">
            <Compass className="h-4 w-4" />
            Découvrir la marketplace
          </Link>
        </div>
      </main>
    );
  }

  let referredByAgentId: string | null = null;
  let displayName = session.user.name?.trim() || session.user.email?.split("@")[0] || "Membre";

  try {
    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referredByAgentId: true, name: true },
    });
    referredByAgentId = row?.referredByAgentId ?? null;
    if (row?.name?.trim()) displayName = row.name.trim();
  } catch {
    referredByAgentId = null;
  }

  if (!referredByAgentId) {
    redirect("/profile");
  }

  let agentCode: string | null = null;
  let agentName: string | null = null;
  try {
    const agent = await prisma.agentProfile.findUnique({
      where: { id: referredByAgentId },
      select: { code: true, user: { select: { name: true, email: true } } },
    });
    agentCode = agent?.code ?? null;
    agentName = agent?.user?.name?.trim() || agent?.user?.email?.split("@")[0] || null;
  } catch {
    agentCode = null;
    agentName = null;
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300/90">Bizaflow · Parrainage</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bienvenue sur VIBRA CONNECT</h1>
          <p className="mt-3 text-sm text-white/75">
            Invité par un agent partenaire Bizaflow — votre compte est lié pour les futures commissions marketplace.
          </p>
        </div>

        <DashboardGlassCard className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/15">
              <Sparkles className="h-7 w-7 text-cyan-200" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-white/80">Bonjour {displayName}</p>
              {agentCode ? (
                <p className="mt-2 font-mono text-lg font-bold text-cyan-200">Code parrain · {agentCode}</p>
              ) : (
                <p className="mt-2 text-sm text-white/60">Parrainage enregistré.</p>
              )}
              {agentName ? (
                <p className="mt-1 text-xs text-white/55">
                  Agent référent : <span className="text-white/80">{agentName}</span>
                </p>
              ) : null}
            </div>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-white/75">
            <li className="flex gap-2">
              <span className="text-cyan-300">✓</span>
              Explorez les commerces locaux et les offres Bizaflow sur la marketplace.
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-300">✓</span>
              Complétez votre profil pour une meilleure expérience (ville, contact).
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-300">✓</span>
              Vous êtes en rôle client : l’espace réservé aux agents reste sur une autre URL sécurisée.
            </li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/explore"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-center text-sm font-semibold text-black sm:flex-none"
            >
              <Compass className="h-4 w-4" />
              Ouvrir la marketplace
            </Link>
            <Link
              href="/profile"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:border-cyan-400/35 sm:flex-none"
            >
              <User className="h-4 w-4" />
              Mon profil
            </Link>
            <Link
              href="/profile/edit"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/90 hover:border-violet-400/35 sm:flex-none"
            >
              Paramètres
            </Link>
          </div>
        </DashboardGlassCard>
      </div>
    </main>
  );
}
