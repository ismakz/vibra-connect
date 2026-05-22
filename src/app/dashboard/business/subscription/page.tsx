import Link from "next/link";

import { BizapaySubscriptionForm } from "@/components/dashboard/bizapay-subscription-form";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { BusinessDashboardNav } from "@/components/dashboard/business-dashboard-nav";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { guardBusinessOwnerArea } from "@/lib/dashboard-business-access";
import { isImageUploadConfigured } from "@/lib/image-upload-config";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { formatMarketplacePlan } from "@/lib/subscription-rules";

export default async function BusinessSubscriptionPage() {
  const session = await guardBusinessOwnerArea();
  const imageUploadConfigured = isImageUploadConfigured();

  const [business, settings, payments] = await Promise.all([
    prisma.business.findFirst({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        expiresAt: true,
      },
    }),
    getPlatformSettings(),
    prisma.payment.findMany({
      where: { userId: session.user.id, provider: "BIZAPAY" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        reference: true,
        requestedPlan: true,
        amount: true,
        status: true,
        createdAt: true,
        ceoComment: true,
      },
    }),
  ]);

  if (!business) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 text-white">
        <DashboardGlassCard className="p-5">
          <p>Créez d’abord votre business pour souscrire un plan marketplace.</p>
          <Link href="/dashboard/business" className="mt-3 inline-flex text-cyan-200 hover:underline">
            Retour au dashboard business
          </Link>
        </DashboardGlassCard>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-white">
      <DashboardPageHeader
        title="Abonnement marketplace Bizapay"
        subtitle="Choisissez votre plan, payez via Mobile Money, puis laissez le CEO valider l’activation."
      />

      <BusinessDashboardNav />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardGlassCard className="p-5">
          <h2 className="text-lg font-bold">Nouvelle demande de paiement</h2>
          <p className="mt-1 text-sm text-white/70">
            Méthodes disponibles: Airtel Money RDC, MTN MoMo Rwanda et paiement manuel. Aucun faux flux: chaque
            paiement reste en attente jusqu’à validation CEO.
          </p>
          <div className="mt-4">
            <BizapaySubscriptionForm
              prices={{
                FREE: settings.freePlanPrice,
                STANDARD: settings.standardPlanPrice,
                PREMIUM: settings.premiumPlanPrice,
                SPONSORED: settings.sponsoredPlanPrice,
              }}
              officialAccounts={{
                mtnMomoRwandaNumber: settings.mtnMomoRwandaNumber,
                mtnMomoRwandaCountry: settings.mtnMomoRwandaCountry,
                mtnMomoRwandaCurrency: settings.mtnMomoRwandaCurrency,
                mtnMomoRwandaEnabled: settings.mtnMomoRwandaEnabled,
                airtelMoneyRdcNumber: settings.airtelMoneyRdcNumber,
                airtelMoneyRdcCountry: settings.airtelMoneyRdcCountry,
                airtelMoneyRdcCurrency: settings.airtelMoneyRdcCurrency,
                airtelMoneyRdcEnabled: settings.airtelMoneyRdcEnabled,
              }}
              imageUploadConfigured={imageUploadConfigured}
            />
          </div>
        </DashboardGlassCard>

        <DashboardGlassCard className="p-5">
          <h3 className="text-base font-bold">Votre statut actuel</h3>
          <p className="mt-2 text-sm text-white/70">{business.name}</p>
          <p className="text-sm text-white/80">
            Plan: <span className="font-semibold text-cyan-200">{formatMarketplacePlan(business.subscriptionPlan)}</span>
          </p>
          <p className="text-sm text-white/80">
            Statut: <span className="font-semibold">{business.subscriptionStatus}</span>
          </p>
          {business.expiresAt && (
            <p className="text-sm text-white/60">Expiration: {business.expiresAt.toLocaleDateString("fr-FR")}</p>
          )}
          <Link href="/tarifs" className="mt-4 inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-cyan-300/40">
            Voir la grille des plans
          </Link>
        </DashboardGlassCard>
      </div>

      <DashboardGlassCard className="mt-6 p-0">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-bold">Historique paiements Bizapay</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/55">
              <tr>
                <th className="px-3 py-3">Référence</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Commentaire CEO</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-3 py-3 font-mono text-xs">{p.reference}</td>
                  <td className="px-3 py-3">{formatMarketplacePlan(p.requestedPlan)}</td>
                  <td className="px-3 py-3">{Number(p.amount).toLocaleString("fr-FR")} USD</td>
                  <td className="px-3 py-3">{p.status}</td>
                  <td className="px-3 py-3 text-xs text-white/60">{p.createdAt.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-3 text-xs text-white/70">{p.ceoComment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="p-5 text-sm text-white/60">Aucune demande de paiement envoyée.</p>}
        </div>
      </DashboardGlassCard>
    </main>
  );
}
