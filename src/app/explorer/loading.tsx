export default function ExplorerLoading() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-3 h-5 w-[28rem] max-w-full animate-pulse rounded bg-white/10" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="glass rounded-2xl p-4">
            <div className="h-9 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-9 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-9 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-24 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-9 animate-pulse rounded-xl bg-white/10" />
          </aside>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <article key={idx} className="glass overflow-hidden rounded-2xl border border-white/10">
                <div className="h-36 animate-pulse bg-white/10" />
                <div className="p-4">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                  <div className="mt-4 h-16 animate-pulse rounded bg-white/10" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="h-9 animate-pulse rounded-full bg-white/10" />
                    <div className="h-9 animate-pulse rounded-full bg-white/10" />
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
