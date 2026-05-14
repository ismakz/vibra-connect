import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";

import { BusinessStickyContactBar } from "@/components/business/business-sticky-contact";
import { ContactActions } from "@/components/business/contact-actions";
import { MarketplaceBusinessCard } from "@/components/marketplace/marketplace-business-card";
import {
  buildWhatsAppUrl,
  formatRating,
  getBusinessCoverImage,
  getBusinessLogoImage,
  isBusinessOpen,
  isBusinessSponsored,
  isDataImage,
} from "@/lib/business-ui";
import { getSimilarMarketplaceRows } from "@/lib/marketplace-queries";
import { isPremiumBadgePlan } from "@/lib/subscription-rules";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@prisma/client";

type BusinessViewModel = {
  id: string;
  slug: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "REJECTED";
  name: string;
  description: string | null;
  address: string | null;
  email?: string | null;
  phone: string | null;
  whatsapp: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  bizaflowTelecomNumber: string | null;
  openingHours: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  galleryImages?: string[];
  verified: boolean;
  featuredUntil: Date | null;
  subscriptionPlan: SubscriptionPlan;
  categoryId: string;
  cityId: string;
  city: { name: string };
  category: { name: string };
  productServices: Array<{ id: string; title: string; description: string; images: string[] | null }>;
  promotions: Array<{ id: string; title: string; description: string; imageUrl: string | null }>;
  reviews: Array<{ id: string; rating: number; comment: string | null; user: { name: string | null } | null }>;
};

function shouldUseUnoptimized(src: string) {
  return isDataImage(src);
}

function makeFallbackBusiness(slug: string): BusinessViewModel {
  return {
    id: `fallback-${slug}`,
    slug,
    status: "ACTIVE" as const,
    name: "Business local VIBRA CONNECT",
    description:
      "Profil vitrine temporaire. Les informations détaillées seront disponibles dès que la base de données sera reconnectée.",
    address: "Adresse en cours de synchronisation",
    email: null,
    phone: null,
    whatsapp: null,
    phoneNumber: null,
    whatsappNumber: null,
    bizaflowTelecomNumber: null,
    openingHours: "08:00-19:00",
    bannerUrl: null,
    logoUrl: null,
    galleryImages: [],
    verified: false,
    featuredUntil: null as Date | null,
    subscriptionPlan: "FREE",
    categoryId: "fallback-cat",
    cityId: "fallback-city",
    city: { name: "Kinshasa" },
    category: { name: "Services" },
    productServices: [] as Array<{ id: string; title: string; description: string; images: string[] | null }>,
    promotions: [] as Array<{ id: string; title: string; description: string; imageUrl: string | null }>,
    reviews: [] as Array<{ id: string; rating: number; comment: string | null; user: { name: string | null } | null }>,
  };
}

export default async function BusinessPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  let databaseAvailable = true;
  let business: BusinessViewModel | null = null;
  try {
    business = (await prisma.business.findUnique({
      where: { slug },
      include: {
        city: true,
        category: true,
        productServices: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 12 },
        promotions: {
          where: {
            status: "PUBLISHED",
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        reviews: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } }, take: 8 },
      },
    })) as unknown as BusinessViewModel | null;
    if (business && !business.id.startsWith("fallback")) {
      await prisma.businessViewEvent.create({ data: { businessId: business.id, source: "profile" } });
    }
  } catch {
    databaseAvailable = false;
    business = makeFallbackBusiness(slug);
  }

  if (databaseAvailable && (!business || business.status !== "ACTIVE")) notFound();
  if (!business) notFound();

  const similar =
    databaseAvailable && !business.id.startsWith("fallback")
      ? await getSimilarMarketplaceRows(business.id, business.categoryId, business.cityId, 4)
      : [];

  const phone = business.phoneNumber ?? business.phone;
  const whatsapp = business.whatsappNumber ?? business.whatsapp;
  const whatsappLink = whatsapp ? buildWhatsAppUrl(whatsapp, business.name) : null;
  const directionLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${business.address ?? ""} ${business.city.name}`)}`;
  const sponsored = isBusinessSponsored(business.featuredUntil, now);
  const openNow = isBusinessOpen(business.openingHours ?? null, now, business.slug);
  const premium = isPremiumBadgePlan(business.subscriptionPlan);

  const ratings = business.reviews.map((r: { rating: number }) => r.rating).filter((r): r is number => typeof r === "number");
  const averageRating =
    ratings.length > 0 ? Math.round((ratings.reduce((a, c) => a + c, 0) / ratings.length) * 10) / 10 : null;

  const coverSrc = getBusinessCoverImage(business);
  const logoSrc = getBusinessLogoImage(business);

  const gallery = [
    ...(business.bannerUrl ? [business.bannerUrl] : []),
    ...(business.logoUrl ? [business.logoUrl] : []),
    ...(business.galleryImages ?? []),
    ...business.productServices.flatMap((item) => item.images ?? []),
    ...business.promotions.flatMap((promo) => (promo.imageUrl ? [promo.imageUrl] : [])),
  ].filter((src, index, arr) => Boolean(src) && arr.indexOf(src) === index);

  const pageUrl =
    typeof process.env.NEXTAUTH_URL === "string" && process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}/b/${business.slug}`
      : `/b/${business.slug}`;

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:pb-10">
        {!databaseAvailable && (
          <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Base de données indisponible pour le moment. Affichage en mode vitrine.
          </p>
        )}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-[1px] shadow-[0_0_60px_rgba(139,92,246,0.12)]">
          <div className="glass overflow-hidden rounded-[1.4rem]">
            <div className="relative h-52 sm:h-72 lg:h-96">
              <Image
                src={coverSrc}
                alt={`Bannière de ${business.name}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority
                unoptimized={shouldUseUnoptimized(coverSrc)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/50 to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {premium && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-50 shadow-lg backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium Bizapay
                  </span>
                )}
                {sponsored && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-600/25 px-3 py-1 text-xs font-bold text-violet-50 backdrop-blur-md">
                    Sponsorisé
                  </span>
                )}
              </div>
            </div>
            <div className="relative px-5 pb-6 pt-0 md:px-8">
              <div className="mt-[-52px] flex flex-col gap-4 sm:mt-[-56px] sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-cyan-400/25 bg-white/10 p-1 shadow-[0_0_40px_rgba(34,211,238,0.25)] sm:h-28 sm:w-28">
                    <Image
                      src={logoSrc}
                      alt={`Logo de ${business.name}`}
                      width={104}
                      height={104}
                      sizes="104px"
                      className="h-full w-full rounded-full object-cover"
                      unoptimized={shouldUseUnoptimized(logoSrc)}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-black tracking-tight sm:text-4xl">{business.name}</h1>
                      {business.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                          <CheckCircle2 className="h-3 w-3" /> Vérifié
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/75">
                      {business.category.name} • {business.city.name}
                    </p>
                  </div>
                </div>
                <div
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    openNow
                      ? "border-green-400/30 bg-green-500/15 text-green-200"
                      : "border-white/20 bg-white/5 text-white/70",
                  ].join(" ")}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {openNow ? "Ouvert maintenant" : "Fermé"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" id="infos">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="text-xs text-white/60">Ville</p>
                  <p className="font-semibold">{business.city.name}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="text-xs text-white/60">Adresse</p>
                  <p className="line-clamp-2 font-semibold">{business.address ?? "Adresse non renseignée"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="text-xs text-white/60">Email</p>
                  <p className="line-clamp-1 font-semibold">{business.email ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="text-xs text-white/60">Note moyenne</p>
                  <p className="inline-flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 fill-cyan-300 text-cyan-300" />
                    {formatRating(averageRating)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm sm:col-span-2 xl:col-span-4">
                  <p className="text-xs text-white/60">Horaires</p>
                  <p className="font-semibold">{business.openingHours ?? "Horaires non communiqués"}</p>
                </div>
              </div>

              <p className="mt-4 text-base leading-relaxed text-white/85" id="description">
                {business.description ??
                  "Ce commerce est actif sur VIBRA CONNECT — module marketplace Bizaflow. Contactez-le en un clic (WhatsApp, appel ou itinéraire)."}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <article className="glass rounded-2xl p-5" id="galerie">
              <h2 className="text-xl font-bold">Galerie</h2>
              {gallery.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {gallery.slice(0, 12).map((src, idx) => (
                    <div
                      key={`${src}-${idx}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 shadow-inner"
                    >
                      <Image
                        src={src}
                        alt={`Visuel ${idx + 1} — ${business.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 hover:scale-[1.04]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                  Aucune image publiée. Les profils Premium peuvent enrichir leur galerie (limite selon plan Bizapay).
                </div>
              )}
            </article>

            <article className="glass rounded-2xl p-5" id="produits">
              <h2 className="text-xl font-bold">Produits & services</h2>
              {business.productServices.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {business.productServices.map((item) => (
                    <article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-2 line-clamp-4 text-sm text-white/75">{item.description}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                  Catalogue en cours de construction sur la marketplace.
                </div>
              )}
            </article>

            <article className="glass rounded-2xl p-5" id="promotions">
              <h2 className="text-xl font-bold">Promotions</h2>
              {business.promotions.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {business.promotions.map((promo) => (
                    <article key={promo.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      {promo.imageUrl && (
                        <div className="relative h-36">
                          <Image
                            src={promo.imageUrl}
                            alt={`Promotion ${promo.title}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold">{promo.title}</h3>
                        <p className="mt-2 text-sm text-white/75">{promo.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                  Aucune promotion active.
                </div>
              )}
            </article>

            <article className="glass rounded-2xl p-5" id="localisation">
              <h2 className="text-xl font-bold">Localisation</h2>
              <p className="mt-2 text-sm text-white/70">
                {business.address ?? "Adresse à confirmer avec le professionnel."} — {business.city.name}
              </p>
              <a
                href={directionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
              >
                <MapPin className="h-4 w-4" />
                Ouvrir l’itinéraire Google Maps
              </a>
            </article>

            <article className="glass rounded-2xl p-5" id="avis">
              <h2 className="text-xl font-bold">Avis clients</h2>
              {business.reviews.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {business.reviews.map((review) => (
                    <article key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{review.user?.name ?? "Client"}</p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">
                          <Star className="h-3.5 w-3.5 fill-cyan-300 text-cyan-300" />
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/75">
                        {review.comment ?? "Avis positif sur ce professionnel."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                  Pas encore d’avis — soyez le premier à recommander ce business.
                </div>
              )}
            </article>

            {similar.length > 0 && (
              <article className="glass rounded-2xl p-5" id="similaires">
                <h2 className="text-xl font-bold">Business similaires</h2>
                <p className="mt-1 text-sm text-white/65">Même catégorie ou région sur VIBRA CONNECT.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {similar.map((row) => (
                    <MarketplaceBusinessCard key={row.id} business={row} />
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <Link
                    href="/explore"
                    className="text-sm font-semibold text-cyan-200 underline-offset-4 hover:underline"
                  >
                    Voir toute la marketplace
                  </Link>
                </div>
              </article>
            )}
          </div>

          <aside className="space-y-4">
            <article className="glass rounded-2xl p-5" id="contact">
              <h2 className="text-lg font-bold">Contact & conversion</h2>
              <p className="mt-2 text-sm text-white/75">
                Chaque action est mesurée (vues, WhatsApp, appels, itinéraires) pour votre ROI marketplace.
              </p>
              <ContactActions
                businessId={business.id}
                businessName={business.name}
                pageUrl={pageUrl}
                phone={phone}
                whatsappLink={whatsappLink}
                directionLink={directionLink}
                email={business.email}
                bizaflowTelecomNumber={business.bizaflowTelecomNumber}
              />
            </article>

            <article className="glass rounded-2xl p-5">
              <h2 className="text-lg font-bold">Paiements acceptés</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  <span>Bizapay</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-300" />
                  <span>Mobile Money</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <MapPin className="h-4 w-4 text-violet-300" />
                  <span>Sur place</span>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </main>

      <BusinessStickyContactBar
        businessId={business.id}
        phone={phone}
        whatsappLink={whatsappLink}
        directionLink={directionLink}
      />
    </div>
  );
}
