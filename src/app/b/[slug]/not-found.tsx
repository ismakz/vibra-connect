import Link from "next/link";

export default function BusinessNotFound() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <main className="mx-auto max-w-4xl px-4 py-14">
        <section className="glass rounded-3xl border border-white/10 p-8 text-center sm:p-12">
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Erreur 404</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Business introuvable</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Ce profil business n&apos;existe plus ou n&apos;est pas encore disponible publiquement. Explorez le marché pour trouver d&apos;autres commerces actifs.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-black"
            >
              Explorer le marché
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/80 hover:border-cyan-300/40 hover:text-cyan-200"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
