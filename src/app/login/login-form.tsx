"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { getSafeInternalCallbackUrl } from "@/lib/safe-callback-url";

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
  const emailUpdated = searchParams.get("emailUpdated") === "1";
  const afterLoginHref = useMemo(
    () => getSafeInternalCallbackUrl(searchParams.get("callbackUrl"), "/"),
    [searchParams],
  );
  const registerHref = useMemo(() => {
    const cb = searchParams.get("callbackUrl");
    if (!cb) return "/register";
    return `/register?callbackUrl=${encodeURIComponent(cb)}`;
  }, [searchParams]);

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
    router.push(afterLoginHref);
    router.refresh();
  }

  const displayError = error || urlError;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form action={onSubmit} className="glass w-full space-y-3 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg" />
          <h1 className="text-xl font-bold">Connexion</h1>
        </div>
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
        {emailUpdated ? (
          <p className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            Votre adresse e-mail a été mise à jour. Connectez-vous avec la nouvelle adresse.
          </p>
        ) : null}
        {displayError && <p className="text-sm text-red-300">{displayError}</p>}
        <button className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-semibold text-black">Se connecter</button>
        <p className="text-center text-sm text-white/60">
          Pas encore de compte ?{" "}
          <Link href={registerHref} className="font-semibold text-cyan-300 hover:underline">
            Créer un compte
          </Link>
        </p>
      </form>
    </main>
  );
}
