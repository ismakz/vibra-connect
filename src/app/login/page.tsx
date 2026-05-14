import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

function LoginFallback() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="glass w-full rounded-2xl p-6 text-center text-sm text-white/70">Chargement…</div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
