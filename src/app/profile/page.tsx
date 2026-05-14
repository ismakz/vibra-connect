import type { ContactPreference } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { UserAvatar } from "@/components/user-avatar";
import { getAuthSession } from "@/lib/auth";
import { contactPreferenceLabel } from "@/lib/contact-preference-ui";
import { navRoleBadge } from "@/lib/nav-user";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ updated?: string }>;

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const showUpdated = sp.updated === "1";

  let databaseAvailable = true;
  let user: {
    name: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    contactPreference: string;
    createdAt: Date;
    city: { name: string } | null;
  } | null = null;

  try {
    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        contactPreference: true,
        createdAt: true,
        city: { select: { name: true } },
      },
    });
    user = row;
  } catch {
    databaseAvailable = false;
  }

  if (!databaseAvailable || !user) {
    return (
      <main className="min-h-screen bg-[#050816] px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <DashboardGlassCard className="border border-amber-400/30 bg-amber-500/10 p-6">
            <p className="font-semibold text-amber-100">Profil temporairement indisponible</p>
            <p className="mt-2 text-sm text-white/75">
              La base de données est inaccessible. Réessayez plus tard ou vérifiez votre connexion.
            </p>
            <p className="mt-4 text-sm text-white/80">
              Compte connecté : <span className="font-mono text-cyan-200">{session.user.email}</span>
            </p>
          </DashboardGlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        {showUpdated && (
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Profil mis à jour avec succès.
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight">Mon profil</h1>
          <Link
            href="/profile/edit"
            className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
          >
            Modifier profil
          </Link>
        </div>

        <DashboardGlassCard className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size={96} className="shrink-0" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xl font-bold">{user.name?.trim() || "Sans nom"}</p>
              <p className="mt-1 truncate text-sm text-white/70">{user.email}</p>
              <p className="mt-2 inline-flex rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-100">
                {navRoleBadge(user.role)}
              </p>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">Téléphone</dt>
              <dd className="mt-1 font-medium text-white/90">{user.phone?.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">Ville</dt>
              <dd className="mt-1 font-medium text-white/90">{user.city?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">Préférence contact</dt>
              <dd className="mt-1 font-medium text-white/90">{contactPreferenceLabel(user.contactPreference as ContactPreference)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">Membre depuis</dt>
              <dd className="mt-1 font-medium text-white/90">{user.createdAt.toLocaleDateString("fr-FR")}</dd>
            </div>
          </dl>
        </DashboardGlassCard>
      </div>
    </main>
  );
}
