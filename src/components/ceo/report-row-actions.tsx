"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { superAdminUpdateReportStatus } from "@/app/dashboard/ceo/actions";

export function ReportRowActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function refresh() {
    router.refresh();
  }

  function setStatus(status: "REVIEWED" | "CLOSED") {
    start(async () => {
      await superAdminUpdateReportStatus(reportId, status);
      refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => setStatus("REVIEWED")}
        className="rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-500/25 sm:text-xs"
      >
        Revu
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setStatus("CLOSED")}
        className="rounded-lg border border-white/25 bg-white/10 px-2 py-1 text-[10px] font-semibold hover:bg-white/15 sm:text-xs"
      >
        Clôturer
      </button>
    </div>
  );
}
