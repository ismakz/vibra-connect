import { LandingPage } from "@/components/landing/landing-page";
import { getAuthSession } from "@/lib/auth";
import { getLandingData } from "@/lib/queries";
import { EXPLORE_MARKET_HREF, getBusinessHref } from "@/lib/nav-user";

export default async function Home() {
  const { categories, cities, featured, locationTree, databaseAvailable } = await getLandingData();
  const session = await getAuthSession();
  const isAuthenticated = Boolean(session?.user?.id);
  const publishBusinessHref = getBusinessHref(session?.user?.role ?? null, isAuthenticated);

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC]">
      {!databaseAvailable && (
        <div className="mx-auto mt-4 max-w-7xl rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de donnees indisponible pour le moment. Affichage en mode vitrine.
        </div>
      )}
      <LandingPage
        categories={categories}
        cities={cities}
        featured={featured}
        locationTree={locationTree}
        publishBusinessHref={publishBusinessHref}
        exploreMarketHref={EXPLORE_MARKET_HREF}
      />
    </div>
  );
}
