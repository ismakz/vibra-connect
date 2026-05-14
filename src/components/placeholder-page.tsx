import Link from "next/link";

export function PlaceholderPage({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <section className="glass rounded-2xl p-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-white/75">{description}</p>
        {ctaHref && ctaLabel && (
          <Link href={ctaHref} className="mt-4 inline-block rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">
            {ctaLabel}
          </Link>
        )}
      </section>
    </main>
  );
}
