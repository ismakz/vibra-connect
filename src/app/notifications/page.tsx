import Link from "next/link";
import { Bell } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { getAuthSession } from "@/lib/auth";

export default async function NotificationsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-amber-200" />
          <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
        </div>
        <DashboardGlassCard className="p-8 text-center">
          <p className="text-sm text-white/75">Vous n’avez aucune notification pour le moment.</p>
          <p className="mt-2 text-xs text-white/50">Les alertes importantes (marketplace, Bizapay, compte) s’afficheront ici lorsqu’elles seront disponibles.</p>
          <Link href="/profile" className="mt-6 inline-block text-sm font-semibold text-cyan-200 hover:underline">
            Retour au profil
          </Link>
        </DashboardGlassCard>
      </div>
    </main>
  );
}
