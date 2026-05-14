import {
  type PaymentMethod,
  type PlatformSettings,
  type SubscriptionPlan,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MarketplaceRequestedPlan = "FREE" | "STANDARD" | "PREMIUM" | "SPONSORED";

export type CreateBizapayPaymentInput = {
  businessId: string;
  userId: string;
  requestedPlan: MarketplaceRequestedPlan;
  paymentMethod: "AIRTEL_MONEY_RDC" | "MTN_MOMO_RWANDA" | "MANUAL";
  payerPhoneNumber: string;
  amount: number;
  currency?: string;
  reference: string;
  proofImageUrl?: string | null;
};

type ProviderChargeAdapter = (input: CreateBizapayPaymentInput) => Promise<{
  providerReference?: string;
  accepted: boolean;
  providerMessage?: string;
}>;

const providerAdapters: Record<"AIRTEL_MONEY_RDC" | "MTN_MOMO_RWANDA" | "MANUAL", ProviderChargeAdapter> = {
  AIRTEL_MONEY_RDC: async () => ({ accepted: true }),
  MTN_MOMO_RWANDA: async () => ({ accepted: true }),
  MANUAL: async () => ({ accepted: true }),
};

function toDbPlan(plan: MarketplaceRequestedPlan): SubscriptionPlan {
  if (plan === "STANDARD") return "STARTER";
  return plan;
}

function paymentMethodToDb(method: "AIRTEL_MONEY_RDC" | "MTN_MOMO_RWANDA" | "MANUAL"): PaymentMethod {
  if (method === "MTN_MOMO_RWANDA") return "MTN_MOMO_RWANDA";
  if (method === "AIRTEL_MONEY_RDC") return "AIRTEL_MONEY_RDC";
  return method;
}

function planPrice(plan: MarketplaceRequestedPlan, settings: Pick<
  PlatformSettings,
  "freePlanPrice" | "standardPlanPrice" | "premiumPlanPrice" | "sponsoredPlanPrice"
>) {
  if (plan === "FREE") return Number(settings.freePlanPrice);
  if (plan === "STANDARD") return Number(settings.standardPlanPrice);
  if (plan === "PREMIUM") return Number(settings.premiumPlanPrice);
  return Number(settings.sponsoredPlanPrice);
}

function expiryForPlan(plan: SubscriptionPlan, now = new Date()) {
  if (plan === "FREE") return null;
  const d = new Date(now);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function createBizapayPaymentRequest(input: CreateBizapayPaymentInput) {
  const settings = await prisma.platformSettings.findUnique({
    where: { singletonKey: "MARKETPLACE" },
    select: {
      freePlanPrice: true,
      standardPlanPrice: true,
      premiumPlanPrice: true,
      sponsoredPlanPrice: true,
    },
  });
  if (!settings) {
    return { ok: false as const, error: "Paramètres marketplace indisponibles." };
  }

  const expectedAmount = planPrice(input.requestedPlan, settings);
  if (Math.abs(expectedAmount - input.amount) > 0.001) {
    return { ok: false as const, error: "Montant invalide pour le plan sélectionné." };
  }

  const adapter = providerAdapters[input.paymentMethod];
  const providerResult = await adapter(input);
  if (!providerResult.accepted) {
    return { ok: false as const, error: providerResult.providerMessage ?? "Paiement refusé par le provider." };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 2);

  const payment = await prisma.payment.create({
    data: {
      businessId: input.businessId,
      userId: input.userId,
      requestedPlan: toDbPlan(input.requestedPlan),
      amount: input.amount,
      currency: input.currency ?? "USD",
      paymentMethod: paymentMethodToDb(input.paymentMethod),
      provider: "BIZAPAY",
      payerPhoneNumber: input.payerPhoneNumber,
      status: "PENDING",
      reference: input.reference,
      proofImageUrl: input.proofImageUrl ?? null,
      expiresAt,
    },
    select: { id: true, reference: true, status: true },
  });

  return { ok: true as const, payment };
}

export async function approveBizapayPayment(paymentId: string, approverUserId: string, ceoComment?: string) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        business: {
          select: {
            id: true,
            ownerId: true,
            referralAgentId: true,
          },
        },
      },
    });
    if (!payment) return { ok: false as const, error: "Paiement introuvable." };
    if (payment.status !== "PENDING") return { ok: false as const, error: "Ce paiement est déjà traité." };

    const now = new Date();
    if (payment.expiresAt && payment.expiresAt.getTime() < now.getTime()) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "EXPIRED", ceoComment: "Paiement expiré avant validation CEO." },
      });
      return { ok: false as const, error: "Paiement expiré." };
    }

    const expiresAt = expiryForPlan(payment.requestedPlan, now);
    const subscription = await tx.subscription.create({
      data: {
        userId: payment.userId,
        businessId: payment.businessId,
        plan: payment.requestedPlan,
        status: "ACTIVE",
        startedAt: now,
        expiresAt,
        amount: payment.amount,
      },
      select: { id: true },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "APPROVED",
        approvedBy: approverUserId,
        approvedAt: now,
        ceoComment: ceoComment?.trim() || null,
      },
    });

    await tx.business.update({
      where: { id: payment.businessId },
      data: {
        subscriptionPlan: payment.requestedPlan,
        subscriptionStatus: "ACTIVE",
        expiresAt,
        featuredUntil: payment.requestedPlan === "SPONSORED" ? expiresAt : null,
        status: "ACTIVE",
        verified: true,
      },
    });

    if (payment.business.referralAgentId) {
      const agent = await tx.agentProfile.findUnique({
        where: { id: payment.business.referralAgentId },
        select: { commissionRate: true },
      });
      if (agent) {
        const amount = Number(payment.amount);
        const rate = Number(agent.commissionRate);
        const commissionAmount = (amount * rate) / 100;
        if (commissionAmount > 0) {
          await tx.commission.create({
            data: {
              agentProfileId: payment.business.referralAgentId,
              subscriptionId: subscription.id,
              amount: commissionAmount,
              isPaid: false,
            },
          });
        }
      }
    }

    return { ok: true as const };
  });

  return result;
}

export async function rejectBizapayPayment(paymentId: string, approverUserId: string, ceoComment?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { id: true, status: true } });
  if (!payment) return { ok: false as const, error: "Paiement introuvable." };
  if (payment.status !== "PENDING") return { ok: false as const, error: "Ce paiement est déjà traité." };

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REJECTED",
      approvedBy: approverUserId,
      approvedAt: new Date(),
      ceoComment: ceoComment?.trim() || null,
    },
  });
  return { ok: true as const };
}

export async function expireStaleBizapayPayments() {
  await prisma.payment.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED", ceoComment: "Paiement expiré automatiquement." },
  });
}
