export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-12 w-80 max-w-full animate-pulse rounded-xl bg-gradient-to-r from-white/10 to-violet-500/10" />
        <div className="mt-3 h-5 w-[32rem] max-w-full animate-pulse rounded bg-white/10" />

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="glass rounded-2xl border border-white/10 p-4">
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-28 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-4 h-11 animate-pulse rounded-xl bg-violet-500/20" />
          </aside>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <article key={idx} className="glass overflow-hidden rounded-2xl border border-white/10">
                <div className="h-40 animate-pulse bg-gradient-to-br from-white/10 to-cyan-500/5" />
                <div className="p-4">
                  <div className="h-5 w-4/5 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                  <div className="mt-4 h-14 animate-pulse rounded-lg bg-white/5" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="h-10 animate-pulse rounded-full bg-emerald-500/15" />
                    <div className="h-10 animate-pulse rounded-full bg-white/10" />
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
