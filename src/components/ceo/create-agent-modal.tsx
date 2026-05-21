"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";

import { LocationCascadingSelects } from "@/components/location/location-cascading-selects";
import type { LocationTreeCountry } from "@/lib/location-queries";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  cityId: string;
  tempPassword: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  cityId: "",
  tempPassword: "",
};

type SuccessPayload = {
  email: string;
  tempPassword: string;
  agentCode: string;
  referralUrl: string;
  createdNewUser: boolean;
};

export function CeoCreateAgentButton({
  locationTree,
  defaultCommissionRate,
  disabled,
}: {
  locationTree: LocationTreeCountry[];
  defaultCommissionRate: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/40"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Créer un agent
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-violet-500/15 px-4 py-2 text-sm font-semibold text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.12)] transition hover:border-cyan-300/55 hover:from-cyan-500/30 hover:to-violet-500/25"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Créer un agent
      </button>
      {open ? (
        <CeoCreateAgentDialog
          key={key}
          locationTree={locationTree}
          defaultCommissionRate={defaultCommissionRate}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CeoCreateAgentDialog({
  locationTree,
  defaultCommissionRate,
  onClose,
}: {
  locationTree: LocationTreeCountry[];
  defaultCommissionRate: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !success) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, success]);

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/45";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError("Indiquez le nom complet (2 caractères minimum).");
      return;
    }
    if (!form.email.trim()) {
      setError("Email requis.");
      return;
    }
    if (!form.cityId) {
      setError("Sélectionnez une ville.");
      return;
    }
    if (form.tempPassword.length < 6) {
      setError("Mot de passe temporaire : au moins 6 caractères.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/ceo/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          cityId: form.cityId,
          tempPassword: form.tempPassword,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
        tempPassword?: string;
        agentCode?: string;
        referralUrl?: string;
        createdNewUser?: boolean;
      };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Échec de la création.");
        return;
      }
      if (
        data.email &&
        data.tempPassword &&
        data.agentCode &&
        data.referralUrl != null &&
        data.createdNewUser != null
      ) {
        setSuccess({
          email: data.email,
          tempPassword: data.tempPassword,
          agentCode: data.agentCode,
          referralUrl: data.referralUrl,
          createdNewUser: data.createdNewUser,
        });
        router.refresh();
      } else {
        setError("Réponse serveur incomplète.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm({ ...emptyForm });
    setSuccess(null);
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ceo-create-agent-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !success) onClose();
      }}
    >
      <div
        className="glass relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 shadow-[0_0_48px_rgba(99,102,241,0.12)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-white/55 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-600/15 p-6 pr-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">CEO · Agents</p>
          <h2 id="ceo-create-agent-title" className="mt-2 text-xl font-black text-white">
            Nouvel agent VIBRA CONNECT
          </h2>
          <p className="mt-1 text-sm text-white/65">
            Compte utilisateur <span className="font-mono text-cyan-200/90">AGENT</span>, profil et code de parrainage
            uniques.
          </p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-100">Agent créé</p>
                <p className="mt-1 text-xs text-white/70">
                  {success.createdNewUser
                    ? "Nouveau compte créé. Transmettez les identifiants ci-dessous à l’agent."
                    : "Profil agent ajouté à un compte existant. Mot de passe et rôle mis à jour."}
                </p>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-white/50">Email</dt>
                  <dd className="mt-0.5 font-mono text-white/90">{success.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Mot de passe temporaire</dt>
                  <dd className="mt-0.5 font-mono text-amber-200/90">{success.tempPassword}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Code agent</dt>
                  <dd className="mt-0.5 font-mono text-lg font-bold text-cyan-200">{success.agentCode}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Lien referral</dt>
                  <dd className="mt-1 break-all rounded-lg bg-black/35 px-3 py-2 font-mono text-xs text-white/85">
                    {success.referralUrl}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 text-sm font-bold text-black"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? (
                <p className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {error}
                </p>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Nom complet</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className={inputClass}
                  placeholder="Prénom et nom"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                  type="email"
                  placeholder="agent@exemple.com"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Téléphone (optionnel)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="+243 …"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Localisation</label>
                <LocationCascadingSelects
                  tree={locationTree}
                  value={form.cityId}
                  onChange={(id) => setForm((p) => ({ ...p, cityId: id }))}
                  valueMode="id"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Mot de passe temporaire</label>
                <input
                  value={form.tempPassword}
                  onChange={(e) => setForm((p) => ({ ...p, tempPassword: e.target.value }))}
                  className={inputClass}
                  type="password"
                  placeholder="À communiquer à l’agent"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">Commission par défaut</label>
                <input
                  value={`${defaultCommissionRate} %`}
                  readOnly
                  className={`${inputClass} cursor-not-allowed opacity-80`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 text-sm font-bold text-black disabled:opacity-60"
                >
                  {saving ? "Création…" : "Créer l’agent"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
