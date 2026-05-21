import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { getLocationTree } from "@/lib/location-queries";

type PageProps = { searchParams: Promise<{ ref?: string; callbackUrl?: string }> };

export default async function RegisterPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const initialReferralCode = (sp.ref ?? "").trim();
  const initialCallbackUrl = (sp.callbackUrl ?? "").trim() || null;

  const locationTree = await getLocationTree().catch(() => []);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="text-sm text-cyan-200/90 hover:underline">
            ← Retour à l’accueil
          </Link>
        </div>
        <RegisterForm
          locationTree={locationTree}
          initialReferralCode={initialReferralCode}
          initialCallbackUrl={initialCallbackUrl}
        />
      </div>
    </main>
  );
}
