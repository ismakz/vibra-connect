import Image from "next/image";
import Link from "next/link";
import { Box } from "lucide-react";

import { ComingSoonButton } from "@/components/dashboard/coming-soon-button";
import { ProductServiceManageButton } from "@/components/dashboard/product-service-form-modal";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { BusinessDashboardNav } from "@/components/dashboard/business-dashboard-nav";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { formatRating, getBusinessCoverImage, isDataImage } from "@/lib/business-ui";
import { getAuthSession } from "@/lib/auth";
import { guardBusinessOwnerArea } from "@/lib/dashboard-business-access";
import { isImageUploadConfigured } from "@/lib/image-upload-config";
import { prisma } from "@/lib/prisma";
import { isUrgentSaleLiveForDisplay } from "@/lib/urgent-sale";

type SearchParams = Promise<{
  q?: string;
  status?: "all" | "available" | "unavailable" | "promotion" | "urgent";
}>;

type ProductRow = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  isAvailable: boolean;
  isPromotion: boolean;
  imageUrl: string;
  storedImageUrl: string;
  businessSlug: string;
  isUrgentSale: boolean;
  urgentSaleStatus: string;
  urgentSaleReason: string | null;
  originalPrice: number | null;
  urgentPrice: number | null;
  urgentSaleEndsAt: Date | null;
  isUrgentDisplay: boolean;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (!value) return null;
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: number | null, currency: string) {
  if (value === null) return "Prix sur demande";
  return `${value.toLocaleString("fr-FR")} ${currency}`;
}

export default async function BusinessProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await guardBusinessOwnerArea();
  const imageUploadConfigured = isImageUploadConfigured();

  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q?.trim() ?? "";

  let databaseAvailable = true;
  let business: { id: string; slug: string; name: string } | null = null;
  let products: ProductRow[] = [];

  async function toggleAvailability(formData: FormData) {
    "use server";
    const current = await getAuthSession();
    if (!current || current.user.role !== "BUSINESS_OWNER") return;
    const productId = formData.get("productId")?.toString();
    const next = formData.get("next")?.toString();
    if (!productId || (next !== "true" && next !== "false")) return;

    const ownerBusiness = await prisma.business.findFirst({
      where: { ownerId: current.user.id },
      select: { id: true },
    });
    if (!ownerBusiness) return;

    await prisma.productService.updateMany({
      where: { id: productId, businessId: ownerBusiness.id },
      data: { isAvailable: next === "true" },
    });
  }

  try {
    business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, slug: true, name: true },
    });

    if (business) {
      const businessSlug = business.slug;
      const now = new Date();
      const where = {
        businessId: business.id,
        status: "PUBLISHED" as const,
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
        ...(status === "available" ? { isAvailable: true } : {}),
        ...(status === "unavailable" ? { isAvailable: false } : {}),
        ...(status === "promotion" ? { isPromotion: true } : {}),
        ...(status === "urgent"
          ? {
              isUrgentSale: true,
              urgentSaleStatus: "ACTIVE" as const,
              urgentSaleEndsAt: { gt: now },
              originalPrice: { not: null },
              urgentPrice: { not: null },
            }
          : {}),
      };

      const dbProducts = await prisma.productService.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          isAvailable: true,
          isPromotion: true,
          isUrgentSale: true,
          urgentSaleStatus: true,
          urgentSaleReason: true,
          originalPrice: true,
          urgentPrice: true,
          urgentSaleEndsAt: true,
        },
      });

      const sorted = [...dbProducts].sort((a, b) => {
        const liveA = isUrgentSaleLiveForDisplay(
          {
            isUrgentSale: a.isUrgentSale,
            urgentSaleStatus: a.urgentSaleStatus,
            urgentSaleEndsAt: a.urgentSaleEndsAt,
            originalPrice: a.originalPrice,
            urgentPrice: a.urgentPrice,
          },
          now,
        );
        const liveB = isUrgentSaleLiveForDisplay(
          {
            isUrgentSale: b.isUrgentSale,
            urgentSaleStatus: b.urgentSaleStatus,
            urgentSaleEndsAt: b.urgentSaleEndsAt,
            originalPrice: b.originalPrice,
            urgentPrice: b.urgentPrice,
          },
          now,
        );
        return Number(liveB) - Number(liveA);
      });

      products = sorted.map((item) => {
        const isUrgentDisplay = isUrgentSaleLiveForDisplay(
          {
            isUrgentSale: item.isUrgentSale,
            urgentSaleStatus: item.urgentSaleStatus,
            urgentSaleEndsAt: item.urgentSaleEndsAt,
            originalPrice: item.originalPrice,
            urgentPrice: item.urgentPrice,
          },
          now,
        );
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          price: toNumber(item.price),
          currency: item.currency,
          isAvailable: item.isAvailable,
          isPromotion: item.isPromotion,
          isUrgentSale: item.isUrgentSale,
          urgentSaleStatus: item.urgentSaleStatus,
          urgentSaleReason: item.urgentSaleReason,
          originalPrice: toNumber(item.originalPrice),
          urgentPrice: toNumber(item.urgentPrice),
          urgentSaleEndsAt: item.urgentSaleEndsAt,
          isUrgentDisplay,
          storedImageUrl: item.images?.[0] ?? "",
          imageUrl:
            item.images?.[0] ??
            getBusinessCoverImage({
              name: item.title,
              category: { name: "Produit / Service" },
              city: { name: business?.name ?? "VIBRA CONNECT" },
            }),
          businessSlug,
        };
      });
    }
  } catch {
    databaseAvailable = false;
    business = { id: "fallback", slug: "business-local-vibra-connect", name: "Business local VIBRA CONNECT" };
    products = [
      {
        id: "fallback-1",
        title: "Service express premium",
        description: "Intervention rapide, qualité professionnelle et accompagnement personnalisé.",
        price: 35,
        currency: "USD",
        isAvailable: true,
        isPromotion: true,
        isUrgentSale: false,
        urgentSaleStatus: "CANCELLED",
        urgentSaleReason: null,
        originalPrice: null,
        urgentPrice: null,
        urgentSaleEndsAt: null,
        isUrgentDisplay: false,
        storedImageUrl: "",
        imageUrl: getBusinessCoverImage({
          name: "Service express premium",
          category: { name: "Service" },
          city: { name: "Vitrine" },
        }),
        businessSlug: business.slug,
      },
      {
        id: "fallback-2",
        title: "Pack accompagnement business",
        description: "Conseils et support pour booster la visibilité et la conversion locale.",
        price: null,
        currency: "USD",
        isAvailable: false,
        isPromotion: false,
        isUrgentSale: false,
        urgentSaleStatus: "CANCELLED",
        urgentSaleReason: null,
        originalPrice: null,
        urgentPrice: null,
        urgentSaleEndsAt: null,
        isUrgentDisplay: false,
        storedImageUrl: "",
        imageUrl: getBusinessCoverImage({
          name: "Pack accompagnement business",
          category: { name: "Produit" },
          city: { name: "Vitrine" },
        }),
        businessSlug: business.slug,
      },
    ].filter((item) => {
      const matchesQ = q ? item.title.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesStatus =
        status === "all" ||
        (status === "available" && item.isAvailable) ||
        (status === "unavailable" && !item.isAvailable) ||
        (status === "promotion" && item.isPromotion) ||
        (status === "urgent" && item.isUrgentDisplay);
      return matchesQ && matchesStatus;
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Produits / services"
        subtitle="Gérez vos offres publiées, leur disponibilité et leur visibilité."
        action={
          <ProductServiceManageButton
            mode="create"
            label="Ajouter un produit/service"
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
            databaseAvailable={databaseAvailable}
            imageUploadConfigured={imageUploadConfigured}
          />
        }
      />

      <BusinessDashboardNav />

      {!databaseAvailable && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de données indisponible pour le moment. Affichage en mode vitrine.
        </p>
      )}

      <DashboardFilterBar
        query={q}
        queryPlaceholder="Rechercher par nom de produit/service"
        status={status}
        options={[
          { value: "all", label: "Tous" },
          { value: "available", label: "Disponible" },
          { value: "unavailable", label: "Indisponible" },
          { value: "promotion", label: "Promotion" },
          { value: "urgent", label: "Vente en urgence" },
        ]}
        resultsCount={products.length}
      />

      {products.length === 0 ? (
        <DashboardEmptyState
          icon={<Box className="h-5 w-5 text-cyan-200" />}
          title="Aucun produit/service trouvé"
          description="Publiez votre première offre pour commencer à recevoir des contacts qualifiés."
          action={
            <ProductServiceManageButton
              mode="create"
              label="Ajouter un produit/service"
              className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-cyan-400"
              databaseAvailable={databaseAvailable}
              imageUploadConfigured={imageUploadConfigured}
            />
          }
        />
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((item) => (
            <DashboardGlassCard key={item.id} hover className="overflow-hidden">
              <div className="relative h-36">
                <Image
                  src={item.imageUrl}
                  alt={`Image de ${item.title}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                  unoptimized={isDataImage(item.imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/75 to-transparent" />
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="line-clamp-1 text-base font-semibold">{item.title}</h2>
                  {item.isPromotion && (
                    <span className="rounded-full border border-violet-300/30 bg-violet-500/15 px-2 py-1 text-xs font-semibold text-violet-100">
                      Promotion
                    </span>
                  )}
                  {item.isUrgentDisplay && (
                    <span className="rounded-full border border-orange-400/35 bg-orange-500/15 px-2 py-1 text-xs font-semibold text-orange-100">
                      Vente en urgence
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-white/70">{item.description}</p>
                {item.isUrgentDisplay && item.originalPrice != null && item.urgentPrice != null ? (
                  <div className="mt-3 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm text-white/45 line-through">{formatPrice(item.originalPrice, item.currency)}</span>
                      <span className="text-sm font-bold text-orange-200">{formatPrice(item.urgentPrice, item.currency)}</span>
                    </div>
                    {item.urgentSaleEndsAt && (
                      <p className="text-xs text-white/55">
                        Fin urgence : {item.urgentSaleEndsAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-cyan-200">{formatPrice(item.price, item.currency)}</p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={[
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      item.isAvailable ? "bg-green-500/20 text-green-200" : "bg-white/10 text-white/70",
                    ].join(" ")}
                  >
                    {item.isAvailable ? "Disponible" : "Indisponible"}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                    Note vitrine: {formatRating(item.price === null ? null : Math.min(5, 3.8 + item.price / 200))}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ProductServiceManageButton
                    mode="edit"
                    label="Modifier"
                    className="rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                    databaseAvailable={databaseAvailable}
                    imageUploadConfigured={imageUploadConfigured}
                    initial={{
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      price: item.price,
                      currency: item.currency,
                      imageUrl: item.storedImageUrl,
                      isAvailable: item.isAvailable,
                      isPromotion: item.isPromotion,
                      isUrgentSale: item.isUrgentSale,
                      originalPrice: item.originalPrice,
                      urgentPrice: item.urgentPrice,
                      urgentSaleReason: item.urgentSaleReason,
                      urgentSaleEndsAt: item.urgentSaleEndsAt?.toISOString() ?? null,
                      urgentSaleStatus: item.urgentSaleStatus,
                    }}
                  />
                  <Link
                    href={`/b/${item.businessSlug}`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                  >
                    Voir public
                  </Link>
                  {databaseAvailable ? (
                    <form action={toggleAvailability}>
                      <input type="hidden" name="productId" value={item.id} />
                      <input type="hidden" name="next" value={item.isAvailable ? "false" : "true"} />
                      <button className="w-full rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30">
                        {item.isAvailable ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                  ) : (
                    <ComingSoonButton
                      label={item.isAvailable ? "Désactiver" : "Réactiver"}
                      className="rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                      description="Action indisponible en mode vitrine (base de données non connectée)."
                    />
                  )}
                </div>
              </div>
            </DashboardGlassCard>
          ))}
        </section>
      )}
    </main>
  );
}
