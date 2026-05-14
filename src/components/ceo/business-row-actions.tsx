"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  superAdminDeleteBusiness,
  superAdminUpdateBusinessStatus,
  superAdminValidateBusiness,
} from "@/app/dashboard/ceo/actions";
import type { BusinessStatus } from "@prisma/client";

export function BusinessRowActions({ id, slug }: { id: string; slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function refresh() {
    router.refresh();
  }

  function setStatus(status: BusinessStatus) {
    start(async () => {
      await superAdminUpdateBusinessStatus(id, status);
      refresh();
    });
  }

  function validate() {
    start(async () => {
      await superAdminValidateBusiness(id);
      refresh();
    });
  }

  function remove() {
    if (!confirm("Supprimer définitivement ce business et ses données liées ?")) return;
    start(async () => {
      await superAdminDeleteBusiness(id);
      refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/b/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-semibold hover:border-cyan-300/35 sm:text-xs"
      >
        Voir
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => setStatus("ACTIVE")}
        className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-50 sm:text-xs"
      >
        Activer
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setStatus("SUSPENDED")}
        className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-50 sm:text-xs"
      >
        Suspendre
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={validate}
        className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50 sm:text-xs"
      >
        Valider
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded-lg border border-red-400/35 bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50 sm:text-xs"
      >
        Supprimer
      </button>
    </div>
  );
}
