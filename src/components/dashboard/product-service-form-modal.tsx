"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ComingSoonButton } from "@/components/dashboard/coming-soon-button";

export type ProductServiceFormInitial = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  imageUrl: string;
  isAvailable: boolean;
  isPromotion: boolean;
};

const defaultForm = {
  title: "",
  description: "",
  priceInput: "",
  currency: "USD",
  imageUrl: "",
  isAvailable: true,
  isPromotion: false,
};

type FormState = typeof defaultForm;

function formFromInitial(initial: ProductServiceFormInitial): FormState {
  return {
    title: initial.title,
    description: initial.description,
    priceInput: initial.price === null ? "" : String(initial.price),
    currency: initial.currency || "USD",
    imageUrl: initial.imageUrl,
    isAvailable: initial.isAvailable,
    isPromotion: initial.isPromotion,
  };
}

export function ProductServiceManageButton({
  mode,
  label,
  className,
  databaseAvailable,
  initial,
}: {
  mode: "create" | "edit";
  label: string;
  className: string;
  databaseAvailable: boolean;
  initial?: ProductServiceFormInitial;
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  if (!databaseAvailable) {
    return (
      <ComingSoonButton
        label={label}
        className={className}
        description="Action indisponible en mode vitrine (base de données non connectée)."
      />
    );
  }

  if (mode === "edit" && !initial) {
    return (
      <button type="button" disabled className={`${className} cursor-not-allowed opacity-50`}>
        {label}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
        className={className}
      >
        {label}
      </button>
      {open ? (
        <ProductServiceFormDialog
          key={instanceKey}
          mode={mode}
          initial={mode === "edit" ? initial : undefined}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ProductServiceFormDialog({
  onClose,
  mode,
  initial,
}: {
  onClose: () => void;
  mode: "create" | "edit";
  initial?: ProductServiceFormInitial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    mode === "edit" && initial ? formFromInitial(initial) : { ...defaultForm },
  );
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40";

  function clientValidate(): string | null {
    if (!form.title.trim()) return "Le titre est requis.";
    if (!form.description.trim()) return "La description est requise.";
    if (!form.currency.trim()) return "La devise est requise.";
    if (form.imageUrl.trim()) {
      try {
        const u = new URL(form.imageUrl.trim());
        if (!["http:", "https:"].includes(u.protocol)) return "L'URL d'image doit commencer par http ou https.";
      } catch {
        return "URL d'image invalide.";
      }
    }
    if (form.priceInput.trim()) {
      const n = Number(form.priceInput.replace(",", ".").trim());
      if (!Number.isFinite(n) || n < 0) return "Le prix doit être un nombre positif ou vide.";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = clientValidate();
    if (err) {
      setStatus({ type: "error", message: err });
      return;
    }

    const price =
      form.priceInput.trim() === "" ? null : Number(form.priceInput.replace(",", ".").trim());

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      currency: form.currency.trim(),
      imageUrl: form.imageUrl.trim(),
      isAvailable: form.isAvailable,
      isPromotion: form.isPromotion,
      price,
    };

    setSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/dashboard/business/products", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "edit" && initial ? { id: initial.id, ...payload } : payload),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !result.ok) {
        setStatus({ type: "error", message: result.error ?? "Échec de la sauvegarde." });
      } else {
        setStatus({ type: "success", message: result.message ?? "Enregistré." });
        router.refresh();
      }
    } catch {
      setStatus({ type: "error", message: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="product-form-title" className="text-lg font-bold">
          {mode === "create" ? "Nouveau produit / service" : "Modifier le produit / service"}
        </h3>
        <p className="mt-1 text-sm text-white/70">
          Les changements sont visibles sur votre vitrine après enregistrement.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/80">Titre</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className={inputClass}
              placeholder="Ex. Pack coaching premium"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/80">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={`${inputClass} min-h-24`}
              placeholder="Décrivez votre offre"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/80">Prix (optionnel)</label>
              <input
                value={form.priceInput}
                onChange={(e) => setForm((p) => ({ ...p, priceInput: e.target.value }))}
                className={inputClass}
                placeholder="Laisser vide = sur demande"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/80">Devise</label>
              <input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className={inputClass}
                placeholder="USD"
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/80">Image (URL optionnelle)</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              className={inputClass}
              placeholder="https://…"
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))}
                className="h-4 w-4 rounded border-white/30 bg-white/10 accent-cyan-400"
              />
              Disponible
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPromotion}
                onChange={(e) => setForm((p) => ({ ...p, isPromotion: e.target.checked }))}
                className="h-4 w-4 rounded border-white/30 bg-white/10 accent-cyan-400"
              />
              Promotion
            </label>
          </div>

          {status.type === "error" && (
            <p className="rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {status.message}
            </p>
          )}
          {status.type === "success" && (
            <p className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {status.message}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:border-cyan-300/35"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : mode === "create" ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
