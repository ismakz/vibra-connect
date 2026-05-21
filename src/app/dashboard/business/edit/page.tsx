import Link from "next/link";

import { BusinessEditForm } from "@/components/dashboard/business-edit-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { guardBusinessOwnerArea } from "@/lib/dashboard-business-access";
import { isImageUploadConfigured } from "@/lib/image-upload-config";
import { getLocationTree } from "@/lib/location-queries";
import { FALLBACK_PLATFORM_SETTINGS, getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export default async function BusinessEditPage() {
  const session = await guardBusinessOwnerArea("/dashboard/business/edit");
  const imageUploadConfigured = isImageUploadConfigured();

  let databaseAvailable = true;
  let business: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string;
    cityId: string;
    address: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    openingHours: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    galleryImages: string[];
    contactPreference: "WHATSAPP" | "PHONE" | "BIZAFLOW_TELECOM" | "INTERNAL_MESSAGE" | "EMAIL";
  } | null = null;
  let locationTree: Awaited<ReturnType<typeof getLocationTree>> = [];
  let categories: Array<{ id: string; name: string }> = [];
  let maxGalleryImages = FALLBACK_PLATFORM_SETTINGS.maxGalleryImages;

  try {
    [business, categories, locationTree] = await Promise.all([
      prisma.business.findFirst({
        where: { ownerId: session.user.id },
        select: {
          id: true,
          name: true,
          description: true,
          categoryId: true,
          cityId: true,
          address: true,
          email: true,
          phone: true,
          whatsapp: true,
          openingHours: true,
          logoUrl: true,
          bannerUrl: true,
          galleryImages: true,
          contactPreference: true,
        },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      getLocationTree(),
    ]);
    const settings = await getPlatformSettings();
    maxGalleryImages = settings.maxGalleryImages;
  } catch {
    databaseAvailable = false;
    locationTree = [];
    categories = [{ id: "fallback-category", name: "Services" }];
  }

  if (!business && databaseAvailable) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
        <DashboardPageHeader
          title="Modifier mon business"
          subtitle="Créez d'abord votre business pour activer l'édition du profil."
          action={
            <Link href="/dashboard/business" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
              Aller au dashboard
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Modifier mon business"
        subtitle="Mettez à jour votre profil public et améliorez votre visibilité sur VIBRA CONNECT."
        statusBadge={databaseAvailable ? "Sauvegarde active" : "Mode vitrine"}
        action={
          <Link href="/dashboard/business" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:border-cyan-300/35">
            Retour dashboard
          </Link>
        }
      />

      {!databaseAvailable && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de donnees indisponible. Le formulaire est visible mais la sauvegarde est désactivée.
        </div>
      )}

      <BusinessEditForm
        databaseAvailable={databaseAvailable}
        maxGalleryImages={maxGalleryImages}
        locationTree={locationTree}
        categories={categories}
        imageUploadConfigured={imageUploadConfigured}
        initialValues={{
          name: business?.name ?? "Business local VIBRA CONNECT",
          description: business?.description ?? "",
          categoryId: business?.categoryId ?? categories[0]?.id ?? "",
          cityId: business?.cityId ?? "",
          address: business?.address ?? "",
          email: business?.email ?? "",
          phone: business?.phone ?? "",
          whatsapp: business?.whatsapp ?? "",
          openingHours: business?.openingHours ?? "",
          logoUrl: business?.logoUrl ?? "",
          bannerUrl: business?.bannerUrl ?? "",
          galleryImages: business?.galleryImages?.join("\n") ?? "",
          contactPreference: (business?.contactPreference as "WHATSAPP" | "PHONE" | "BIZAFLOW_TELECOM" | "INTERNAL_MESSAGE" | "EMAIL") ?? "WHATSAPP",
        }}
      />
    </main>
  );
}
