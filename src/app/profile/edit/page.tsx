import type { ContactPreference } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { UserProfileEditForm } from "@/components/profile/user-profile-edit-form";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfileEditPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  let cities: Array<{ id: string; name: string }> = [];
  let initial: {
    name: string;
    phone: string;
    cityId: string;
    avatarUrl: string;
    contactPreference: ContactPreference;
  } = {
    name: session.user.name?.trim() || "",
    phone: "",
    cityId: "",
    avatarUrl: "",
    contactPreference: "WHATSAPP",
  };

  try {
    const [user, cityRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          phone: true,
          cityId: true,
          avatarUrl: true,
          contactPreference: true,
        },
      }),
      prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    cities = cityRows;
    if (user) {
      initial = {
        name: user.name?.trim() || "",
        phone: user.phone?.trim() ?? "",
        cityId: user.cityId ?? "",
        avatarUrl: user.avatarUrl?.trim() ?? "",
        contactPreference: user.contactPreference,
      };
    }
  } catch {
    cities = [];
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight">Modifier le profil</h1>
          <Link href="/profile" className="text-sm text-cyan-200 hover:underline">
            Retour au profil
          </Link>
        </div>
        <DashboardGlassCard className="p-6">
          {cities.length === 0 ? (
            <p className="mb-4 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Liste des villes temporairement indisponible. Vous pouvez enregistrer le reste du profil et réessayer plus tard
              pour associer une ville.
            </p>
          ) : null}
          <UserProfileEditForm initial={initial} cities={cities} />
        </DashboardGlassCard>
      </div>
    </main>
  );
}
