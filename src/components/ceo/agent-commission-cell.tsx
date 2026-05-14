"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AgentCommissionCell({
  agentId,
  initialRate,
}: {
  agentId: string;
  initialRate: number;
}) {
  const router = useRouter();
  const [rate, setRate] = useState(String(initialRate));
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    const numeric = Number(rate);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      setStatus("error");
      return;
    }
    startTransition(async () => {
      setStatus("idle");
      try {
        const res = await fetch(`/api/ceo/agents/${agentId}/commission`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commissionRate: numeric }),
        });
        const data = (await res.json()) as { ok?: boolean };
        if (!res.ok || !data.ok) {
          setStatus("error");
          return;
        }
        setStatus("ok");
        router.refresh();
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={rate}
        onChange={(e) => {
          setRate(e.target.value);
          setStatus("idle");
        }}
        onBlur={save}
        className="w-16 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs text-white"
        inputMode="decimal"
      />
      <span className="text-xs text-white/60">%</span>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-100 disabled:opacity-40"
      >
        OK
      </button>
      {status === "ok" ? <span className="text-[10px] text-emerald-200">✓</span> : null}
      {status === "error" ? <span className="text-[10px] text-rose-200">!</span> : null}
    </div>
  );
}

