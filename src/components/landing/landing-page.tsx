"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Phone, Star } from "lucide-react";
import { useMemo, useState } from "react";

import {
  buildWhatsAppUrl,
  distanceKm,
  fallbackPhone,
  fallbackRating,
  formatRating,
  getBusinessCoverImage,
  getBusinessLogoImage,
  isBusinessOpen,
  isDataImage,
} from "@/lib/business-ui";
import { CATEGORY_ICON_BY_SLUG } from "@/lib/category-catalog";
import { slugify } from "@/lib/slug";

type Category = { id: string; name: string; slug: string };
type City = { id: string; name: string; slug: string };
type Featured = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: { name: string; slug: string };
  category: { name: string; slug: string };
  verified: boolean;
  bannerUrl: string | null;
  logoUrl: string | null;
  openingHours: string | null;
  contactPhone: string | null;
  rating: number | null;
  isSponsored: boolean;
};

type QuickFilter = "ALL" | "VERIFIED" | "PROMOTIONS" | "OPEN_NOW" | "NEAR_ME";

function shouldUseUnoptimized(src: string) {
  return isDataImage(src);
}

function computeOpenNow(openingHours: string | null, slug: string, now: Date) {
  return isBusinessOpen(openingHours, now, slug);
}

export function LandingPage({
  categories,
  cities,
  featured,
}: {
  categories: Category[];
  cities: City[];
  featured: Featured[];
}) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const hasManyCategories = categories.length > 12;
  const visibleCategories = useMemo(
    () => (showAllCategories ? categories : categories.slice(0, 12)),
    [categories, showAllCategories],
  );

  const [businessFilter, setBusinessFilter] = useState<QuickFilter>("ALL");

  const fallbackFeatured = useMemo<Featured[]>(() => {
    const pickCategory = (i: number) => categories[i % Math.max(1, categories.length)];
    const pickCity = (i: number) => cities[i % Math.max(1, cities.length)];

    const base = [
      {
        name: "Café Kin Café",
        description: "Café, boissons chaudes, pâtisseries et service de livraison locale.",
        openingHours: "07:30-19:00",
        verified: true,
        isSponsored: true,
      },
      {
        name: "Boutique Mode LUX",
        description: "Vêtements tendance, chaussures et accessoires pour toute la famille.",
        openingHours: "09:00-20:00",
        verified: true,
        isSponsored: false,
      },
      {
        name: "Goma Tech Réparations",
        description: "Réparation téléphones, accessoires, recharges et installation services.",
        openingHours: "08:30-18:30",
        verified: false,
        isSponsored: true,
      },
      {
        name: "Pharmacie Saint-Luc",
        description: "Médicaments essentiels, conseils santé et permanence selon horaires.",
        openingHours: "08:00-17:30",
        verified: true,
        isSponsored: false,
      },
      {
        name: "Garage Atlas Auto",
        description: "Mécanique générale, diagnostic et pièces détachées de qualité.",
        openingHours: "08:00-18:00",
        verified: false,
        isSponsored: false,
      },
      {
        name: "Hôtel Horizon Confort",
        description: "Chambres confortables, services et accompagnement pour séjours d’affaires.",
        openingHours: "24/7",
        verified: true,
        isSponsored: false,
      },
    ];

    return base.map((item, i) => {
      const city = pickCity(i);
      const category = pickCategory(i + 2);
      return {
        id: `fallback-${i}`,
        slug: slugify(item.name),
        name: item.name,
        description: item.description,
        verified: item.verified,
        isSponsored: item.isSponsored,
        city: { name: city?.name ?? "Kinshasa", slug: city?.slug ?? "kinshasa" },
        category: { name: category?.name ?? "Services", slug: category?.slug ?? "services" },
        bannerUrl: null,
        logoUrl: null,
        openingHours: item.openingHours,
        contactPhone: null,
        rating: null,
      };
    });
  }, [cities, categories]);

  const baseBusinesses = featured.length > 0 ? featured : fallbackFeatured;

  const now = new Date();
  const enrichedBusinesses = useMemo(() => {
    return baseBusinesses.map((b) => {
      const ratingFinal = typeof b.rating === "number" ? b.rating : fallbackRating(b.slug);
      const distance = distanceKm(b.slug);
      const openNow = computeOpenNow(b.openingHours, b.slug, now);

      const phone = b.contactPhone ?? fallbackPhone(b.slug);
      const whatsappLink = buildWhatsAppUrl(phone, b.name);

      const coverSrc = getBusinessCoverImage(b);
      const logoSrc = getBusinessLogoImage(b);

      const description = b.description ?? "Business local vérifié sur VIBRA CONNECT.";

      return {
        ...b,
        ratingFinal,
        distanceKm: distance,
        openNow,
        whatsappLink,
        coverSrc,
        logoSrc,
        description,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseBusinesses]);

  const filteredBusinesses = useMemo(() => {
    switch (businessFilter) {
      case "VERIFIED":
        return enrichedBusinesses.filter((b) => b.verified);
      case "PROMOTIONS":
        return enrichedBusinesses.filter((b) => b.isSponsored);
      case "OPEN_NOW":
        return enrichedBusinesses.filter((b) => b.openNow);
      case "NEAR_ME":
        return enrichedBusinesses.filter((b) => b.distanceKm <= 5);
      case "ALL":
      default:
        return enrichedBusinesses;
    }
  }, [businessFilter, enrichedBusinesses]);

  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-12 lg:grid-cols-2 lg:items-center">
        <div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1 text-xs text-cyan-300">
            Bizaflow Ready • Bizapay intégré • WhatsApp First
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-4xl font-black leading-tight md:text-6xl">
            Le marché digital nouvelle génération pour les business africains.
          </motion.h1>
          <p className="mt-5 max-w-xl text-white/75">Publiez votre commerce, attirez des clients, recevez des paiements et connectez-vous à l’écosystème Bizaflow.</p>
          <p className="mt-3 max-w-xl text-sm text-slate-400">Restaurants, boutiques, hôtels, cybercafés, pharmacies, garages, immobilier, services et entrepreneurs locaux peuvent maintenant être visibles dans toute leur ville.</p>
          <form action="/explore" className="mt-6 grid gap-3 md:grid-cols-3">
            <input name="q" placeholder="Produit, service ou business" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <select name="city" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              <option value="">Toutes les villes</option>
              {cities.map((city) => <option key={city.id} value={city.slug}>{city.name}</option>)}
            </select>
            <button className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 font-semibold text-black">Explorer le marché</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-black">Publier mon business</Link>
            <Link href="/explore" className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm">Explorer le marché</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
            {["Bizapay intégré", "WhatsApp Business", "Bizaflow Ready", "Bizaflow Telecom bientôt"].map((badge) => (
              <span key={badge} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{badge}</span>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative">
          <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -bottom-6 -right-10 h-40 w-40 rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="glass rounded-3xl p-5">
            <div className="rounded-2xl border border-white/10 bg-[#0b1330] p-4">
              <p className="text-xs text-cyan-300">Marketplace live analytics</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3 text-sm">Vues & conversion</div>
                <div className="rounded-xl bg-white/5 p-3 text-sm">Clics WhatsApp trackés</div>
                <div className="rounded-xl bg-white/5 p-3 text-sm">Paiements Bizapay</div>
                <div className="rounded-xl bg-white/5 p-3 text-sm">Réseau agents Bizaflow</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl font-bold">Explorer les catégories populaires</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleCategories.map((cat) => {
            const icon = CATEGORY_ICON_BY_SLUG[cat.slug] ?? CATEGORY_ICON_BY_SLUG[slugify(cat.name)] ?? "📌";
            return (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="glass group rounded-2xl p-4 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_0_36px_rgba(6,182,212,0.18)]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg">
                  {icon}
                </span>
                <p className="mt-3 text-sm font-medium">{cat.name}</p>
              </Link>
            );
          })}
        </div>
        {hasManyCategories && (
          <div className="mt-5">
            <button
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm transition hover:border-cyan-300/40 hover:text-cyan-200"
            >
              {showAllCategories ? "Voir moins de catégories" : "Voir toutes les catégories"}
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-bold">Business populaires</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Découvrez les commerces et services les plus visibles autour de vous.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["ALL", "Tous"],
                ["VERIFIED", "Vérifiés"],
                ["PROMOTIONS", "Promotions"],
                ["OPEN_NOW", "Ouverts"],
                ["NEAR_ME", "Près de moi"],
              ] as const
            ).map(([id, label]) => {
              const active = businessFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBusinessFilter(id)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm transition",
                    active
                      ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                      : "border-white/20 bg-white/5 text-white/70 hover:border-cyan-300/30 hover:text-cyan-200",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="glass mt-4 rounded-2xl p-4 text-sm text-white/80">
              Aucun résultat pour ce filtre.
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setBusinessFilter("ALL")}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 font-semibold text-black"
                >
                  Voir tous les business
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((b) => (
                <article
                  key={b.id}
                  className="glass group overflow-hidden rounded-2xl border border-white/10 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_0_46px_rgba(6,182,212,0.18)]"
                >
                  <div className="relative h-28 sm:h-36">
                    <Image
                      src={b.coverSrc}
                      alt={`Couverture de ${b.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      unoptimized={shouldUseUnoptimized(b.coverSrc)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/85 via-[#050816]/35 to-transparent" />

                    <div className="absolute left-3 top-3">
                      <div
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                          b.openNow
                            ? "border border-green-400/30 bg-green-500/15 text-green-200"
                            : "border border-white/15 bg-white/5 text-white/60",
                        ].join(" ")}
                      >
                        <Clock className="h-3 w-3" />
                        {b.openNow ? "Ouvert maintenant" : "Fermé"}
                      </div>
                    </div>

                    {b.isSponsored && (
                      <div className="absolute right-3 top-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-gradient-to-r from-violet-500/20 to-cyan-400/15 px-3 py-1 text-xs font-semibold text-violet-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_20px_rgba(167,139,250,0.55)]" />
                          Sponsorisé
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4 pt-0">
                    <div className="mt-[-24px] flex items-start gap-3">
                      <div className="h-12 w-12 flex-none overflow-hidden rounded-full border border-white/20 bg-white/10 p-1 shadow-[0_0_26px_rgba(34,211,238,0.14)]">
                        <Image
                          src={b.logoSrc}
                          alt={`Logo de ${b.name}`}
                          width={48}
                          height={48}
                          sizes="48px"
                          className="h-full w-full rounded-full object-cover"
                          unoptimized={shouldUseUnoptimized(b.logoSrc)}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">{b.name}</h3>
                          {b.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Vérifié
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-white/70">
                          {b.category.name} • {b.city.name}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">
                            <Star className="h-3.5 w-3.5 fill-cyan-300 text-cyan-300" />
                            <span className="font-semibold text-white">{formatRating(b.ratingFinal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-white/70">{b.description}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={b.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-green-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
                      >
                        WhatsApp
                      </a>
                      <Link
                        href={`/b/${b.slug}`}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/40 hover:bg-white/10"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-2">
        <article className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold">Paiements simplifiés avec Bizapay</h3>
          <p className="mt-2 text-white/75">Recevez vos paiements et gérez vos abonnements rapidement grâce à Bizapay.</p>
          <p className="mt-3 text-sm text-cyan-300">Payer avec Bizapay</p>
          <p className="text-xs text-slate-400">Paiement rapide, sécurisé et connecté à l’écosystème Bizaflow.</p>
        </article>
        <article className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold">Devenez agent VIBRA CONNECT</h3>
          <p className="mt-2 text-white/75">Recrutez des business et gagnez des commissions sur chaque abonnement.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-white/5 p-2">Commissions</div>
            <div className="rounded-lg bg-white/5 p-2">Referrals</div>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <article className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold">Connecté à Bizaflow Telecom</h3>
          <p className="mt-2 text-white/75">Les business pourront bientôt communiquer directement via Bizaflow Telecom.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm">
            <Phone className="h-4 w-4 text-cyan-300" /> Bientôt disponible
          </div>
        </article>
      </section>

      <footer className="border-t border-white/10 bg-[#060b20]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3">
          <div>
            <p className="font-bold tracking-widest text-cyan-300">VIBRA CONNECT</p>
            <p className="mt-2 text-sm text-slate-400">Marketplace marketing local, prêt pour l’écosystème Bizaflow.</p>
          </div>
          <div className="text-sm text-slate-400">
            <p>Explorer</p><p>Tarifs</p><p>Agents</p>
          </div>
          <div className="text-sm text-slate-400">
            <p>Powered by Bizaflow Ecosystem</p>
            <p className="mt-2">© {new Date().getFullYear()} VIBRA CONNECT</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
