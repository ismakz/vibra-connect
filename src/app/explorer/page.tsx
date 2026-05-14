import { redirect } from "next/navigation";

/** Ancienne route — marketplace premium sur `/explore`. */
export default async function LegacyExplorerRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") p.set(k, v);
    else if (Array.isArray(v) && v[0]) p.set(k, v[0]);
  }
  const q = p.toString();
  redirect(q ? `/explore?${q}` : "/explore");
}
