"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ExploreSearchField({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(initialQ);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const p = new URLSearchParams(sp.toString());
      const next = value.trim();
      const cur = p.get("q") ?? "";
      if (next === cur) return;
      if (next) p.set("q", next);
      else p.delete("q");
      p.delete("page");
      router.replace(`/explore?${p.toString()}`, { scroll: false });
    }, 320);
    return () => window.clearTimeout(t);
  }, [value, router, sp]);

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/45" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Recherche intelligente — nom, activité…"
        className="w-full rounded-xl border border-white/15 bg-white/[0.07] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 shadow-inner focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
        autoComplete="off"
      />
    </label>
  );
}
