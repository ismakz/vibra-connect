import Link from "next/link";

import { BusinessCreateLocationPick } from "@/components/dashboard/business-create-location-pick";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { guardBusinessCreatePage } from "@/lib/dashboard-business-access";
import { getLocationTree } from "@/lib/location-queries";
import { prisma } from "@/lib/prisma";
import { selectFormDense } from "@/lib/select-classes";

import { createFirstBusinessAction } from "./actions";

/**
 * Si redirection vers login : activer `BUSINESS_CREATE_GUARD_DEBUG=1` sur Vercel
 * pour journaliser `[vc-business-create-guard]` (sans données personnelles).
 */
type SearchParams = Promise<{ error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  champs_requis: "Veuillez remplir le nom, la ville et la catégorie.",
};

export default async function BusinessCreatePage({ searchParams }: { searchParams: SearchParams }) {
  await guardBusinessCreatePage();
  const sp = await searchParams;
  const formError = sp.error ? ERROR_MESSAGES[sp.error] ?? "Une erreur est survenue. Réessayez." : null;

  let databaseAvailable = true;
  let locationTree: Awaited<ReturnType<typeof getLocationTree>> = [];
  let categories: Array<{ id: string; name: string }> = [];

  try {
    [locationTree, categories] = await Promise.all([
      getLocationTree(),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
  } catch {
    databaseAvailable = false;
    locationTree = [];
    categories = [{ id: "fallback-category", name: "Services" }];
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Publier mon business"
        subtitle="Créez votre vitrine VIBRA CONNECT — vous pourrez enrichir le profil et les offres ensuite."
        action={
          <Link href="/explore" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:border-cyan-300/40">
            Voir la marketplace
          </Link>
        }
      />

      {!databaseAvailable && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de données indisponible. Réessayez sous peu pour publier votre business.
        </p>
      )}

      {formError ? (
        <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {formError}
        </p>
      ) : null}

      <DashboardGlassCard className="mt-6 max-w-xl p-5">
        <form action={createFirstBusinessAction} className="space-y-3">
          <p className="text-sm text-white/75">
            Renseignez les informations minimales. Après validation par l’équipe, votre profil pourra être mis en ligne
            selon les règles marketplace.
          </p>
          <label className="block text-xs text-white/70">
            Nom du business
            <input
              name="name"
              placeholder="Ex. Café Mwangaza"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"
              required
              maxLength={200}
            />
          </label>
          <div className="space-y-3">
            <p className="text-xs text-white/70">Ville</p>
            <BusinessCreateLocationPick locationTree={locationTree} disabled={!databaseAvailable} />
            <label className="block text-xs text-white/70">
              Catégorie
              <select name="categoryId" className={`${selectFormDense} mt-1 w-full`} required>
                <option value="">Choisir…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!databaseAvailable}
          >
            Créer mon business
          </button>
        </form>
      </DashboardGlassCard>
    </main>
  );
}
