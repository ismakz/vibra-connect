import { LandingPage } from "@/components/landing/landing-page";
import { getLandingData } from "@/lib/queries";

export default async function Home() {
  const { categories, cities, featured, databaseAvailable } = await getLandingData();
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC]">
      {!databaseAvailable && (
        <div className="mx-auto mt-4 max-w-7xl rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Base de donnees indisponible pour le moment. Affichage en mode vitrine.
        </div>
      )}
      <LandingPage categories={categories} cities={cities} featured={featured} />
    </div>
  );
}
