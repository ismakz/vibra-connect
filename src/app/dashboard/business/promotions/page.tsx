import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";

import { ComingSoonButton } from "@/components/dashboard/coming-soon-button";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getBusinessCoverImage, isDataImage } from "@/lib/business-ui";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  status?: "all" | "active" | "expired" | "draft";
}>;

type PromotionRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date | null;
  status: "active" | "expired" | "draft";
  linkedProduct: string | null;
  businessSlug: string;
};

function getPromotionStatus(params: { status: "PUBLISHED" | "DRAFT" | "ARCHIVED"; expiresAt: Date | null; now: Date }) {
  if (params.status === "DRAFT") return "draft" as const;
  if (params.status === "ARCHIVED") return "expired" as const;
  if (params.expiresAt && params.expiresAt.getTime() < params.now.getTime()) return "expired" as const;
  return "active" as const;
}

function formatDate(value: Date | null) {
  if (!value) return "Non définie";
  return value.toLocaleDateString("fr-FR");
}

export default async function BusinessPromotionsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "BUSINESS_OWNER") redirect("/");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const statusFilter = params.status ?? "all";
  const now = new Date();

  let databaseAvailable = true;
  let business: { id: string; slug: string; name: string } | null = null;
  let promotions: PromotionRow[] = [];

  async function togglePromotion(formData: FormData) {
    "use server";
    const current = await getAuthSession();
    if (!current || current.user.role !== "BUSINESS_OWNER") return;

    const promotionId = formData.get("promotionId")?.toString();
    const nextStatus = formData.get("nextStatus")?.toString();
    if (!promotionId || (nextStatus !== "PUBLISHED" && nextStatus !== "ARCHIVED")) return;

    const ownerBusiness = await prisma.business.findFirst({
      where: { ownerId: current.user.id },
      select: { id: true },
    });
    if (!ownerBusiness) return;

    await prisma.promotion.updateMany({
      where: { id: promotionId, businessId: ownerBusiness.id },
      data: { status: nextStatus },
    });
  }

  try {
    business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, slug: true, name: true },
    });

    if (business) {
      const businessSlug = business.slug;
      const [dbPromotions, latestProducts] = await Promise.all([
        prisma.promotion.findMany({
          where: {
            businessId: business.id,
            ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
        }),
        prisma.productService.findMany({
          where: { businessId: business.id, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { title: true },
        }),
      ]);

      promotions = dbPromotions
        .map((promo, idx) => {
          const normalizedTitle = promo.title.toLowerCase();
          const linked = latestProducts.find((p) => normalizedTitle.includes(p.title.toLowerCase()));
          const status = getPromotionStatus({ status: promo.status, expiresAt: promo.expiresAt, now });
          return {
            id: promo.id,
            title: promo.title,
            description: promo.description,
            imageUrl:
              promo.imageUrl ??
              getBusinessCoverImage({
                name: promo.title,
                category: { name: "Promotion" },
                city: { name: business?.name ?? "VIBRA CONNECT" },
              }),
            startDate: new Date(promo.createdAt.getTime() - idx * 1000),
            endDate: promo.expiresAt,
            status,
            linkedProduct: linked?.title ?? null,
            businessSlug,
          };
        })
        .filter((item) => {
          if (statusFilter === "all") return true;
          return item.status === statusFilter;
        });
    }
  } catch {
    databaseAvailable = false;
    business = { id: "fallback", slug: "business-local-vibra-connect", name: "Business local VIBRA CONNECT" };
    const fallbackPromotions: PromotionRow[] = [
      {
        id: "fallback-promo-1",
        title: "Promo lancement premium",
        description: "Réduction spéciale de lancement valable sur une sélection de services.",
        imageUrl: getBusinessCoverImage({
          name: "Promo lancement premium",
          category: { name: "Promotion" },
          city: { name: "Vitrine" },
        }),
        startDate: new Date(now.getTime()),
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
        status: "active",
        linkedProduct: "Service express premium",
        businessSlug: "business-local-vibra-connect",
      },
      {
        id: "fallback-promo-2",
        title: "Offre saisonnière",
        description: "Offre temporaire pour fidéliser vos meilleurs clients.",
        imageUrl: getBusinessCoverImage({
          name: "Offre saisonnière",
          category: { name: "Promotion" },
          city: { name: "Vitrine" },
        }),
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
        endDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
        status: "expired",
        linkedProduct: null,
        businessSlug: "business-local-vibra-connect",
      },
      {
        id: "fallback-promo-3",
        title: "Draft interne",
        description: "Promotion en cours de préparation avant publication.",
        imageUrl: getBusinessCoverImage({
          name: "Draft interne",
          category: { name: "Promotion" },
          city: { name: "Vitrine" },
        }),
        startDate: new Date(now.getTime()),
        endDate: null,
        status: "draft",
        linkedProduct: null,
        businessSlug: "business-local-vibra-connect",
      },
    ];
    promotions = fallbackPromotions.filter((item) => {
      const matchesQ = q ? item.title.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Promotions"
        subtitle="Gérez les offres visibles sur VIBRA CONNECT et suivez leur état."
        action={
          <ComingSoonButton
            label="Créer une promotion"
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
            description="Le formulaire de création de promotion sera bientôt disponible."
          />
        }
      />

      {!databaseAvailable && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de donnees indisponible pour le moment. Affichage en mode vitrine.
        </p>
      )}

      <DashboardFilterBar
        query={q}
        queryPlaceholder="Rechercher par titre de promotion"
        status={statusFilter}
        options={[
          { value: "all", label: "Toutes" },
          { value: "active", label: "Actives" },
          { value: "expired", label: "Expirées" },
          { value: "draft", label: "Brouillon" },
        ]}
        resultsCount={promotions.length}
      />

      {promotions.length === 0 ? (
        <DashboardEmptyState
          icon={<Megaphone className="h-5 w-5 text-violet-200" />}
          title="Aucune promotion trouvée"
          description="Lancez une promotion pour augmenter la visibilité de vos offres et attirer plus de clients."
          action={
            <ComingSoonButton
              label="Créer une promotion"
              className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500"
              description="Le formulaire de création sera bientôt disponible."
            />
          }
        />
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {promotions.map((promo) => {
            const isActive = promo.status === "active";
            const isDraft = promo.status === "draft";
            const nextStatus = isActive ? "ARCHIVED" : "PUBLISHED";
            return (
              <DashboardGlassCard
                key={promo.id}
                hover
                className="overflow-hidden transition hover:border-violet-300/30 hover:shadow-[0_0_42px_rgba(139,92,246,0.18)]"
              >
                <div className="relative h-36">
                  <Image
                    src={promo.imageUrl}
                    alt={`Image de ${promo.title}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized={isDataImage(promo.imageUrl)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/75 to-transparent" />
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="line-clamp-1 text-base font-semibold">{promo.title}</h2>
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        promo.status === "active"
                          ? "bg-green-500/20 text-green-200"
                          : promo.status === "draft"
                            ? "bg-white/10 text-white/75"
                            : "bg-amber-500/20 text-amber-200",
                      ].join(" ")}
                    >
                      {promo.status === "active" ? "Actif" : promo.status === "draft" ? "Brouillon" : "Expiré"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-white/70">{promo.description}</p>

                  <div className="mt-3 space-y-1 text-xs text-white/70">
                    <p>Date début: {formatDate(promo.startDate)}</p>
                    <p>Date fin: {formatDate(promo.endDate)}</p>
                    <p>Produit lié: {promo.linkedProduct ?? "Non renseigné"}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ComingSoonButton
                      label="Modifier"
                      className="rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                      description="Le formulaire de modification sera bientôt disponible."
                    />
                    <Link
                      href={`/b/${promo.businessSlug}`}
                      className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                    >
                      Voir public
                    </Link>
                    {databaseAvailable ? (
                      isDraft ? (
                        <ComingSoonButton
                          label="Activer"
                          className="rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                          description="La publication d'une promotion brouillon sera bientôt disponible via le formulaire dédié."
                        />
                      ) : (
                      <form action={togglePromotion}>
                        <input type="hidden" name="promotionId" value={promo.id} />
                        <input type="hidden" name="nextStatus" value={nextStatus} />
                        <button className="w-full rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30">
                          {isActive ? "Désactiver" : "Activer"}
                        </button>
                      </form>
                      )
                    ) : (
                      <ComingSoonButton
                        label={isActive ? "Désactiver" : "Activer"}
                        className="rounded-xl border border-white/20 bg-white/5 px-2 py-2 text-xs hover:border-cyan-300/30"
                        description="Action indisponible en mode vitrine (base de données non connectée)."
                      />
                    )}
                  </div>
                </div>
              </DashboardGlassCard>
            );
          })}
        </section>
      )}
    </main>
  );
}
