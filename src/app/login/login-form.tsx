"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function authUrlErrorMessage(code: string | null): string {
  if (!code) return "";
  const messages: Record<string, string> = {
    Configuration:
      "Configuration NextAuth incorrecte ou obsolète. Vérifiez NEXTAUTH_URL et NEXTAUTH_SECRET dans .env, redémarrez `npm run dev`, puis réessayez.",
    AccessDenied: "Accès refusé.",
    Verification: "Lien de vérification invalide ou expiré.",
  };
  return messages[code] ?? "Une erreur d'authentification s'est produite. Réessayez ou contactez le support.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = useMemo(() => authUrlErrorMessage(searchParams.get("error")), [searchParams]);

  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setError("");
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Connexion impossible, verifiez vos informations.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const displayError = error || urlError;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form action={onSubmit} className="glass w-full space-y-3 rounded-2xl p-6">
        <h1 className="text-xl font-bold">Connexion</h1>
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Mot de passe"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2"
          required
        />
        {displayError && <p className="text-sm text-red-300">{displayError}</p>}
        <button className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-semibold text-black">Se connecter</button>
      </form>
    </main>
  );
}
