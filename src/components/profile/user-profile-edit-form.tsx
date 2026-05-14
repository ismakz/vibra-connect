"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContactPreference } from "@prisma/client";

import { contactPreferenceLabel } from "@/lib/contact-preference-ui";

type CityOption = { id: string; name: string };

export function UserProfileEditForm({
  initial,
  cities,
}: {
  initial: {
    name: string;
    phone: string;
    cityId: string;
    avatarUrl: string;
    contactPreference: ContactPreference;
  };
  cities: CityOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [cityId, setCityId] = useState(initial.cityId);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [contactPreference, setContactPreference] = useState<ContactPreference>(initial.contactPreference);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          cityId: cityId || "",
          avatarUrl,
          contactPreference,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "Échec de l’enregistrement.");
        return;
      }
      router.push("/profile?updated=1");
      router.refresh();
    } catch {
      setErrorMessage("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/45";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs text-white/70">Nom</span>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-white/70">Téléphone</span>
        <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-white/70">Ville</span>
        <select className={inputClass} value={cityId} onChange={(e) => setCityId(e.target.value)}>
          <option value="">— Non renseignée —</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-white/70">URL avatar (https…)</span>
        <input
          className={inputClass}
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-white/70">Préférence de contact</span>
        <select
          className={inputClass}
          value={contactPreference}
          onChange={(e) => setContactPreference(e.target.value as ContactPreference)}
        >
          {(["WHATSAPP", "PHONE", "BIZAFLOW_TELECOM", "INTERNAL_MESSAGE", "EMAIL"] as const).map((k) => (
            <option key={k} value={k}>
              {contactPreferenceLabel(k)}
            </option>
          ))}
        </select>
      </label>

      {errorMessage ? (
        <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{errorMessage}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
