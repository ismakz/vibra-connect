import Link from "next/link";

import { getPlatformSettings } from "@/lib/platform-settings";

export default async function PricingPage() {
  const settings = await getPlatformSettings();
  const plans = [
    {
      key: "FREE",
      label: "FREE",
      price: settings.freePlanPrice,
      description: "Présence de base pour démarrer sur la marketplace.",
      advantages: ["Fiche business visible", "Contact client essentiel"],
      limitations: ["Produits limités", "Pas de sponsoring", "Analytics basiques"],
    },
    {
      key: "STANDARD",
      label: "STANDARD",
      price: settings.standardPlanPrice,
      description: "Plan croissance locale pour business réguliers.",
      advantages: ["Plus de produits", "Visibilité améliorée", "Support prioritaire"],
      limitations: ["Pas de boost sponsorisé", "Analytics premium limités"],
    },
    {
      key: "PREMIUM",
      label: "PREMIUM",
      price: settings.premiumPlanPrice,
      description: "Performance avancée pour scaler votre acquisition.",
      advantages: ["Capacité élevée", "Analytics premium", "Priorité dans certains tris"],
      limitations: ["Sans boost sponsorisé natif"],
      popular: true,
    },
    {
      key: "SPONSORED",
      label: "SPONSORED",
      price: settings.sponsoredPlanPrice,
      description: "Visibilité maximale avec mise en avant marketplace.",
      advantages: ["Boost sponsorisé", "Mise en avant homepage", "Positionnement prioritaire"],
      limitations: ["Coût plus élevé"],
      spotlight: true,
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-black">Plans marketplace</h1>
        <p className="mt-2 text-sm text-white/70">
          Tarification réelle pilotée depuis la base de données PlatformSettings.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.key}
            className={[
              "glass relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl",
              plan.spotlight
                ? "border-violet-300/40 bg-gradient-to-br from-violet-500/20 to-cyan-500/15 shadow-[0_0_40px_rgba(139,92,246,0.25)]"
                : "border-white/10 bg-white/5",
            ].join(" ")}
          >
            {plan.popular && (
              <span className="absolute right-3 top-3 rounded-full bg-cyan-400/20 px-2 py-1 text-[10px] font-bold uppercase text-cyan-100">
                Populaire
              </span>
            )}
            {plan.spotlight && (
              <span className="absolute right-3 top-3 rounded-full bg-violet-400/25 px-2 py-1 text-[10px] font-bold uppercase text-violet-100">
                Sponsorisé
              </span>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{plan.label}</p>
            <p className="mt-3 text-3xl font-black">{plan.price.toLocaleString("fr-FR")} USD</p>
            <p className="mt-1 text-sm text-white/65">/ mois</p>
            <p className="mt-4 text-sm text-white/75">{plan.description}</p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Avantages</p>
              <ul className="mt-2 space-y-1 text-xs text-white/80">
                {plan.advantages.map((adv) => (
                  <li key={adv}>• {adv}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Limitations</p>
              <ul className="mt-2 space-y-1 text-xs text-white/70">
                {plan.limitations.map((lim) => (
                  <li key={lim}>• {lim}</li>
                ))}
              </ul>
            </div>
            <Link
              href="/dashboard/business/subscription"
              className="mt-5 inline-flex rounded-full border border-cyan-300/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
            >
              Souscrire
            </Link>
          </article>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/explore"
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:border-cyan-400/35"
        >
          Explorer la marketplace
        </Link>
        <Link
          href="/dashboard/business"
          className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Gérer mon business
        </Link>
      </div>
    </main>
  );
}
