"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return "Expiré";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${Math.max(1, m)} min`;
}

export function UrgentSaleCountdown({ endsAtIso }: { endsAtIso: string }) {
  const [label, setLabel] = useState(() => formatRemaining(new Date(endsAtIso).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => setLabel(formatRemaining(new Date(endsAtIso).getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [endsAtIso]);

  return <span className="tabular-nums">{label}</span>;
}
