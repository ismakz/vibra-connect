"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { superAdminSuspendUser, superAdminUpdateUserRole } from "@/app/dashboard/ceo/actions";
import type { UserRole } from "@prisma/client";

import { formatUserRoleForUi } from "@/lib/ceo-platform";
import { selectCeoRole } from "@/lib/select-classes";

const roles: UserRole[] = ["SUPER_ADMIN", "BUSINESS_OWNER", "AGENT", "CLIENT"];

export function UserRowActions({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function refresh() {
    router.refresh();
  }

  function changeRole(role: UserRole) {
    if (role === currentRole) return;
    start(async () => {
      await superAdminUpdateUserRole(userId, role);
      refresh();
    });
  }

  function suspend() {
    if (!confirm("Rétrograder cet utilisateur en CLIENT ? (perte accès business/agent)")) return;
    start(async () => {
      await superAdminSuspendUser(userId);
      refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <select
        disabled={pending}
        value={currentRole}
        onChange={(e) => changeRole(e.target.value as UserRole)}
        className={selectCeoRole}
        aria-label="Changer le rôle"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {formatUserRoleForUi(r)}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || currentRole === "CLIENT"}
        onClick={suspend}
        className="rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-40 sm:text-xs"
      >
        Suspendre
      </button>
    </div>
  );
}
