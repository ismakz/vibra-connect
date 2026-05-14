"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [referralNotice, setReferralNotice] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref")?.trim().toUpperCase() ?? "";

  async function onSubmit(formData: FormData) {
    setError("");
    setMessage("");
    setReferralNotice("");
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      ref: referralCode || undefined,
    };
    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? "Connexion impossible, verifiez vos informations.");
      return;
    }
    setMessage(data.message);
    if (data.referralMessage) setReferralNotice(data.referralMessage);
    setTimeout(() => router.push("/login"), 900);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form action={onSubmit} className="glass w-full space-y-3 rounded-2xl p-6">
        <h1 className="text-xl font-bold">Creer un compte</h1>
        {referralCode && (
          <p className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200">
            Inscription avec agent partenaire ({referralCode})
          </p>
        )}
        <input name="name" placeholder="Nom complet" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2" required />
        <input name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2" required />
        <input name="password" type="password" placeholder="Mot de passe" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2" required />
        <select name="role" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2">
          <option value="BUSINESS_OWNER">Business owner</option>
          <option value="AGENT">Agent</option>
          <option value="CLIENT">Client</option>
        </select>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-green-300">{message}</p>}
        {referralNotice && <p className="text-xs text-cyan-200">{referralNotice}</p>}
        <button className="w-full rounded-lg bg-violet-600 px-3 py-2 font-semibold">Creer mon compte</button>
      </form>
    </main>
  );
}
