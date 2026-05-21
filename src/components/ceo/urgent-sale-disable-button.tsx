"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { superAdminDisableUrgentSale } from "@/app/dashboard/ceo/actions";

export function UrgentSaleDisableButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Retirer cette vente urgente de la marketplace ? Le produit reste publié au prix normal.")) return;
        start(async () => {
          try {
            await superAdminDisableUrgentSale(productId);
            router.refresh();
          } catch {
            window.alert("Action refusée ou erreur serveur.");
          }
        });
      }}
      className="rounded-lg border border-rose-400/35 bg-rose-500/15 px-2 py-1 text-[10px] font-semibold text-rose-100 hover:bg-rose-500/25 disabled:opacity-40 sm:text-xs"
    >
      Retirer urgence
    </button>
  );
}
