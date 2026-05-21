/** Autorise uniquement les chemins internes (pas d’open redirect). */
export function getSafeInternalCallbackUrl(raw: string | null | undefined, fallback: string): string {
  if (raw === undefined || raw === null) return fallback;
  let t = raw.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    return fallback;
  }
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://")) return fallback;
  return t;
}
