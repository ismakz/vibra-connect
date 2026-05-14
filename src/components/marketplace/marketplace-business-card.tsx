"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, Eye, Sparkles, Star } from "lucide-react";

import {
  buildWhatsAppUrl,
  fallbackPhone,
  formatRating,
  getBusinessCoverImage,
  getBusinessLogoImage,
  isBusinessOpen,
  isBusinessSponsored,
  isDataImage,
} from "@/lib/business-ui";
import { isPremiumBadgePlan } from "@/lib/subscription-rules";
import type { MarketplaceBusinessRow } from "@/lib/marketplace-queries";

function shouldUseUnoptimized(src: string) {
  return isDataImage(src);
}

async function trackWhatsApp(businessId: string, target: string) {
  try {
    await fetch(`/api/businesses/${businessId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "WHATSAPP", target }),
    });
  } catch {
    /* non bloquant */
  }
}

export function MarketplaceBusinessCard({
  business,
  serialized,
}: {
  business: MarketplaceBusinessRow;
  /** Sérialisation JSON des dates (API / RSC) */
  serialized?: boolean;
}) {
  const now = new Date();
  const featuredUntil =
    serialized && business.featuredUntil
      ? new Date(business.featuredUntil as unknown as string)
      : (business.featuredUntil ?? null);

  const ratings = business.reviews.map((r) => r.rating).filter((n) => typeof n === "number");
  const rating =
    ratings.length > 0 ? Math.round((ratings.reduce((a, c) => a + c, 0) / ratings.length) * 10) / 10 : null;

  const openNow = isBusinessOpen(business.openingHours ?? null, now, business.slug);
  const sponsored = isBusinessSponsored(featuredUntil, now);
  const hasPromotion = business.promotions.length > 0;
  const phone =
    business.whatsappNumber ?? business.whatsapp ?? business.phoneNumber ?? business.phone ?? fallbackPhone(business.slug);
  const whatsappLink = buildWhatsAppUrl(phone, business.name);
  const views = business._count.viewEvents;
  const premium = isPremiumBadgePlan(business.subscriptionPlan);

  const coverSrc = getBusinessCoverImage({
    name: business.name,
    slug: business.slug,
    bannerUrl: business.bannerUrl,
    logoUrl: business.logoUrl,
    category: business.category,
    city: business.city,
  });
  const logoSrc = getBusinessLogoImage({
    name: business.name,
    slug: business.slug,
    bannerUrl: business.bannerUrl,
    logoUrl: business.logoUrl,
    category: business.category,
    city: business.city,
  });

  return (
    <article className="glass group overflow-hidden rounded-2xl border border-white/10 transition hover:-translate-y-1 hover:border-violet-400/25 hover:shadow-[0_0_48px_rgba(139,92,246,0.12)]">
      <div className="relative h-32 sm:h-40">
        <Image
          src={coverSrc}
          alt={`Couverture ${business.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
          unoptimized={shouldUseUnoptimized(coverSrc)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/90 via-[#050816]/40 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <div
            className={[
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-xs",
              openNow
                ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                : "border border-white/15 bg-black/40 text-white/65",
            ].join(" ")}
          >
            <Clock className="h-3 w-3" />
            {openNow ? "Ouvert" : "Fermé"}
          </div>
          {premium && (
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-100 sm:text-xs">
              <Sparkles className="h-3 w-3" />
              Premium
            </div>
          )}
          {sponsored && (
            <div className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-cyan-500/20 px-2.5 py-1 text-[10px] font-semibold text-violet-50 sm:text-xs">
              Sponsorisé
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-1 text-[10px] font-medium text-white/85 sm:text-xs">
          <Eye className="h-3 w-3 text-cyan-300" />
          {views.toLocaleString("fr-FR")}
        </div>
      </div>

      <div className="px-4 pb-4 pt-0">
        <div className="mt-[-22px] flex items-start gap-3">
          <div className="h-12 w-12 flex-none overflow-hidden rounded-full border border-white/20 bg-white/10 p-0.5 shadow-[0_0_22px_rgba(34,211,238,0.12)]">
            <Image
              src={logoSrc}
              alt={`Logo ${business.name}`}
              width={48}
              height={48}
              className="h-full w-full rounded-full object-cover"
              unoptimized={shouldUseUnoptimized(logoSrc)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold tracking-tight">{business.name}</h2>
              {business.verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Vérifié
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-white/65">
              {business.category.name} • {business.city.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
                <Star className="h-3.5 w-3.5 fill-cyan-300 text-cyan-300" />
                <span className="font-semibold">{formatRating(rating)}</span>
              </span>
              {hasPromotion && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                  Promo
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-white/70">
          {business.description ?? "Entreprise locale sur VIBRA CONNECT — marketplace Bizaflow."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void trackWhatsApp(business.id, whatsappLink)}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-3 py-2 text-sm font-semibold text-black shadow-[0_0_20px_rgba(16,185,129,0.35)] transition hover:brightness-110"
          >
            WhatsApp
          </a>
          <Link
            href={`/b/${business.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            Voir le profil
          </Link>
        </div>
      </div>
    </article>
  );
}
