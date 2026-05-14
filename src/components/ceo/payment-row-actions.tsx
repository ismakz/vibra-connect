"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { superAdminApprovePayment, superAdminRejectPayment } from "@/app/dashboard/ceo/actions";

export function PaymentRowActions({ paymentId, status }: { paymentId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const canModerate = status === "PENDING";

  function refresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={pending || !canModerate}
        onClick={() => {
          if (!confirm("Approuver ce paiement ?")) return;
          const comment = prompt("Commentaire CEO (optionnel) :") ?? "";
          start(async () => {
            await superAdminApprovePayment(paymentId, comment);
            refresh();
          });
        }}
        className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40 sm:text-xs"
      >
        Approuver
      </button>
      <button
        type="button"
        disabled={pending || !canModerate}
        onClick={() => {
          if (!confirm("Rejeter ce paiement ?")) return;
          const comment = prompt("Motif de rejet (optionnel) :") ?? "";
          start(async () => {
            await superAdminRejectPayment(paymentId, comment);
            refresh();
          });
        }}
        className="rounded-lg border border-red-400/35 bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-40 sm:text-xs"
      >
        Rejeter
      </button>
    </div>
  );
}
