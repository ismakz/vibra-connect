"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400/45";

export function AccountSecurityForms({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/user/change-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: emailCurrentPassword,
          newEmail,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setEmailError(data.error ?? "Impossible de mettre à jour l’e-mail.");
        return;
      }
      await signOut({ callbackUrl: "/login?emailUpdated=1" });
    } catch {
      setEmailError("Erreur réseau. Réessayez.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");
    setPwdLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwdCurrent,
          newPassword: pwdNew,
          confirmPassword: pwdConfirm,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setPwdError(data.error ?? "Impossible de mettre à jour le mot de passe.");
        return;
      }
      setPwdSuccess(data.message ?? "Mot de passe mis à jour.");
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch {
      setPwdError("Erreur réseau. Réessayez.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-bold text-white">Changer d’e-mail</h2>
        <p className="mt-1 text-xs text-white/55">Votre mot de passe actuel est requis pour confirmer l’opération.</p>
        <form onSubmit={onChangeEmail} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">E-mail actuel</span>
            <input className={`${inputClass} opacity-80`} value={currentEmail} readOnly tabIndex={-1} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">Nouvel e-mail</span>
            <input
              className={inputClass}
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">Mot de passe actuel</span>
            <input
              className={inputClass}
              type="password"
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {emailError ? (
            <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{emailError}</p>
          ) : null}
          <button
            type="submit"
            disabled={emailLoading}
            className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
          >
            {emailLoading ? "Mise à jour…" : "Mettre à jour l’e-mail"}
          </button>
        </form>
      </section>

      <div className="border-t border-white/10" />

      <section>
        <h2 className="text-lg font-bold text-white">Changer le mot de passe</h2>
        <p className="mt-1 text-xs text-white/55">Minimum 6 caractères. Votre session reste active après le changement.</p>
        <form onSubmit={onChangePassword} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">Mot de passe actuel</span>
            <input
              className={inputClass}
              type="password"
              value={pwdCurrent}
              onChange={(e) => setPwdCurrent(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">Nouveau mot de passe</span>
            <input
              className={inputClass}
              type="password"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/70">Confirmation</span>
            <input
              className={inputClass}
              type="password"
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {pwdError ? (
            <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{pwdError}</p>
          ) : null}
          {pwdSuccess ? (
            <p className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{pwdSuccess}</p>
          ) : null}
          <button
            type="submit"
            disabled={pwdLoading}
            className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {pwdLoading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}
