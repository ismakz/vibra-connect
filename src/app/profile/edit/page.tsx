import type { ContactPreference } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { AccountSecurityForms } from "@/components/profile/account-security-forms";
import { UserProfileEditForm } from "@/components/profile/user-profile-edit-form";
import { getAuthSession } from "@/lib/auth";
import { isImageUploadConfigured } from "@/lib/image-upload-config";
import { getLocationTree } from "@/lib/location-queries";
import { prisma } from "@/lib/prisma";

export default async function ProfileEditPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  let accountEmail = session.user.email?.trim() ?? "";
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

  let locationTree = await getLocationTree().catch(() => []);

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        cityId: true,
        avatarUrl: true,
        contactPreference: true,
      },
    });
    if (user) {
      accountEmail = user.email.trim();
      initial = {
        name: user.name?.trim() || "",
        phone: user.phone?.trim() ?? "",
        cityId: user.cityId ?? "",
        avatarUrl: user.avatarUrl?.trim() ?? "",
        contactPreference: user.contactPreference,
      };
    }
  } catch {
    locationTree = [];
  }

  const imageUploadConfigured = isImageUploadConfigured();

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight">Modifier le profil</h1>
          <Link href="/profile" className="text-sm text-cyan-200 hover:underline">
            Retour au profil
          </Link>
        </div>
        <DashboardGlassCard className="p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Profil public</h2>
          <UserProfileEditForm initial={initial} locationTree={locationTree} imageUploadConfigured={imageUploadConfigured} />
        </DashboardGlassCard>

        <DashboardGlassCard id="securite-compte" className="scroll-mt-24 p-6">
          <h2 className="mb-1 text-lg font-bold text-white">Sécurité du compte</h2>
          <p className="mb-6 text-xs text-white/55">E-mail et mot de passe sont vérifiés côté serveur (bcrypt, unicité).</p>
          <AccountSecurityForms currentEmail={accountEmail} />
        </DashboardGlassCard>
      </div>
    </main>
  );
}
