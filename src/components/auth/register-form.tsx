"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import type { LocationTreeCountry } from "@/lib/location-queries";
import { getSafeInternalCallbackUrl } from "@/lib/safe-callback-url";

import { LocationCascadingSelects } from "@/components/location/location-cascading-selects";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/45";

type ApiOk = {
  ok: true;
  message: string;
  email: string;
  invitedByValidAgent: boolean;
  refProvidedButInvalid: boolean;
};

type ApiErr = { ok?: false; message?: string };

export function RegisterForm({
  locationTree,
  initialReferralCode,
  initialCallbackUrl,
}: {
  locationTree: LocationTreeCountry[];
  initialReferralCode: string;
  initialCallbackUrl?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cityId, setCityId] = useState("");
  const [ref, setRef] = useState(initialReferralCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showPartnerBanner = initialReferralCode.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          confirmPassword,
          cityId,
          ref,
        }),
      });
      const data = (await res.json()) as ApiOk | ApiErr;
      if (!res.ok || !("ok" in data) || !data.ok) {
        setError((data as ApiErr).message ?? "Impossible de créer le compte.");
        return;
      }

      const sign = await signIn("credentials", {
        email: data.email,
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError("Compte créé, mais la connexion automatique a échoué. Connectez-vous manuellement.");
        router.push("/login");
        return;
      }

      if (data.invitedByValidAgent) {
        router.push("/invite/agent");
      } else if (data.refProvidedButInvalid) {
        router.push("/profile?welcome=1&refInvalid=1");
      } else {
        const next = getSafeInternalCallbackUrl(initialCallbackUrl, "/profile?welcome=1");
        router.push(next);
      }
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.12)]">
      <div className="flex items-start gap-3">
        <Image src="/logo.svg" alt="" width={44} height={44} className="mt-0.5 h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">Bizaflow · VIBRA CONNECT</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Créer un compte</h1>
          <p className="mt-2 text-sm text-white/65">Rejoignez la marketplace en quelques secondes.</p>
        </div>
      </div>

      {showPartnerBanner ? (
        <p className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100">
          Invité par un agent partenaire Bizaflow
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">Nom complet</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">E-mail</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">Téléphone (optionnel)</span>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} autoComplete="tel" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">Mot de passe</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">Confirmation du mot de passe</span>
          <input
            className={inputClass}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">Ville (optionnel)</span>
          <LocationCascadingSelects
            tree={locationTree}
            value={cityId}
            onChange={setCityId}
            valueMode="id"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-white/70">Code parrainage / ref (optionnel)</span>
          <input
            className={`${inputClass} font-mono uppercase`}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            maxLength={64}
            placeholder="Ex. AG-ABC123"
            autoComplete="off"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-sm font-semibold text-black shadow-lg disabled:opacity-50"
        >
          {loading ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-cyan-300 hover:underline">
          Connexion
        </Link>
      </p>
    </div>
  );
}
