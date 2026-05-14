"use client";

import { useEffect, useMemo, useState } from "react";

export type PlatformSettingsFormValue = {
  defaultAgentCommission: number;
  freePlanPrice: number;
  standardPlanPrice: number;
  premiumPlanPrice: number;
  sponsoredPlanPrice: number;
  maxProductsFree: number;
  maxProductsStandard: number;
  maxProductsPremium: number;
  maxGalleryImages: number;
  sponsoredBoostLevel: number;
  maintenanceMode: boolean;
  mtnMomoRwandaNumber: string;
  mtnMomoRwandaCountry: string;
  mtnMomoRwandaCurrency: string;
  mtnMomoRwandaEnabled: boolean;
  airtelMoneyRdcNumber: string;
  airtelMoneyRdcCountry: string;
  airtelMoneyRdcCurrency: string;
  airtelMoneyRdcEnabled: boolean;
};

export function PlatformSettingsPanel({ initial }: { initial: PlatformSettingsFormValue }) {
  const [form, setForm] = useState<PlatformSettingsFormValue>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(initial));

  const dirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);

  async function persist(next: PlatformSettingsFormValue) {
    setSaving(true);
    setStatus({ type: "idle", message: "" });
    try {
      const res = await fetch("/api/ceo/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus({ type: "error", message: data.error ?? "Échec de la sauvegarde." });
        return;
      }
      setSavedSnapshot(JSON.stringify(next));
      setStatus({ type: "ok", message: "Configuration enregistrée." });
    } catch {
      setStatus({ type: "error", message: "Erreur réseau pendant la sauvegarde." });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      void persist(form);
    }, 700);
    return () => clearTimeout(t);
  }, [dirty, form]);

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/45";

  return (
    <section className="glass rounded-2xl border border-white/10 p-5" id="platform-settings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Configuration Marketplace</h2>
          <p className="text-sm text-white/65">
            Paramètres plateforme pilotés par le CEO (prix, limites, sponsoring, commissions).
          </p>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            saving
              ? "bg-cyan-500/20 text-cyan-100"
              : dirty
                ? "bg-amber-500/20 text-amber-100"
                : "bg-emerald-500/20 text-emerald-100",
          ].join(" ")}
        >
          {saving ? "Sauvegarde..." : dirty ? "Modifications en cours" : "Synchronisé"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <legend className="px-1 text-xs uppercase tracking-wider text-cyan-200/80">Commissions & sponsoring</legend>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Commission agent par défaut (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className={inputClass}
              value={form.defaultAgentCommission}
              onChange={(e) =>
                setForm((p) => ({ ...p, defaultAgentCommission: Number(e.target.value || 0) }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Niveau boost sponsorisé</span>
            <input
              type="number"
              min={1}
              max={20}
              step={1}
              className={inputClass}
              value={form.sponsoredBoostLevel}
              onChange={(e) => setForm((p) => ({ ...p, sponsoredBoostLevel: Number(e.target.value || 1) }))}
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) => setForm((p) => ({ ...p, maintenanceMode: e.target.checked }))}
            />
            Mode maintenance marketplace (explore + API)
          </label>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <legend className="px-1 text-xs uppercase tracking-wider text-cyan-200/80">Prix abonnements (USD)</legend>
          {(
            [
              ["freePlanPrice", "Free"],
              ["standardPlanPrice", "Standard"],
              ["premiumPlanPrice", "Premium"],
              ["sponsoredPlanPrice", "Sponsored"],
            ] as const
          ).map(([key, label]) => (
            <label className="block" key={key}>
              <span className="mb-1 block text-xs text-white/65">{label}</span>
              <input
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: Number(e.target.value || 0) }))}
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <legend className="px-1 text-xs uppercase tracking-wider text-cyan-200/80">Limites produits</legend>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Max produits Free</span>
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={form.maxProductsFree}
              onChange={(e) => setForm((p) => ({ ...p, maxProductsFree: Number(e.target.value || 1) }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Max produits Standard</span>
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={form.maxProductsStandard}
              onChange={(e) => setForm((p) => ({ ...p, maxProductsStandard: Number(e.target.value || 1) }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Max produits Premium/Sponsored</span>
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={form.maxProductsPremium}
              onChange={(e) => setForm((p) => ({ ...p, maxProductsPremium: Number(e.target.value || 1) }))}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <legend className="px-1 text-xs uppercase tracking-wider text-cyan-200/80">Limites médias</legend>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Max images galerie</span>
            <input
              type="number"
              min={1}
              max={200}
              step={1}
              className={inputClass}
              value={form.maxGalleryImages}
              onChange={(e) => setForm((p) => ({ ...p, maxGalleryImages: Number(e.target.value || 1) }))}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <legend className="px-1 text-xs uppercase tracking-wider text-cyan-200/80">Comptes Mobile Money officiels</legend>
          <div className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
            Ces numéros sont affichés aux business sur la page de souscription Bizapay.
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-white/65">MTN MoMo Rwanda — Numéro</span>
            <input
              type="text"
              className={inputClass}
              value={form.mtnMomoRwandaNumber}
              onChange={(e) => setForm((p) => ({ ...p, mtnMomoRwandaNumber: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-white/65">Pays</span>
              <input
                type="text"
                className={inputClass}
                value={form.mtnMomoRwandaCountry}
                onChange={(e) => setForm((p) => ({ ...p, mtnMomoRwandaCountry: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/65">Devise</span>
              <input
                type="text"
                className={inputClass}
                value={form.mtnMomoRwandaCurrency}
                onChange={(e) => setForm((p) => ({ ...p, mtnMomoRwandaCurrency: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.mtnMomoRwandaEnabled}
              onChange={(e) => setForm((p) => ({ ...p, mtnMomoRwandaEnabled: e.target.checked }))}
            />
            Activer MTN MoMo Rwanda
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-white/65">Airtel Money RDC — Numéro</span>
            <input
              type="text"
              className={inputClass}
              value={form.airtelMoneyRdcNumber}
              onChange={(e) => setForm((p) => ({ ...p, airtelMoneyRdcNumber: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-white/65">Pays</span>
              <input
                type="text"
                className={inputClass}
                value={form.airtelMoneyRdcCountry}
                onChange={(e) => setForm((p) => ({ ...p, airtelMoneyRdcCountry: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/65">Devise</span>
              <input
                type="text"
                className={inputClass}
                value={form.airtelMoneyRdcCurrency}
                onChange={(e) => setForm((p) => ({ ...p, airtelMoneyRdcCurrency: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.airtelMoneyRdcEnabled}
              onChange={(e) => setForm((p) => ({ ...p, airtelMoneyRdcEnabled: e.target.checked }))}
            />
            Activer Airtel Money RDC
          </label>
        </fieldset>
      </div>

      {status.type !== "idle" ? (
        <p
          className={[
            "mt-4 rounded-xl border px-3 py-2 text-sm",
            status.type === "ok"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-500/10 text-rose-100",
          ].join(" ")}
        >
          {status.message}
        </p>
      ) : null}
    </section>
  );
}

