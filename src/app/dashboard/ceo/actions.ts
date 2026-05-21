"use server";

import { BusinessStatus, ReportStatus, UserRole, UrgentSaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CEO_DASHBOARD_PATH, isPlatformCeoRole } from "@/lib/ceo-platform";
import { approveBizapayPayment, rejectBizapayPayment } from "@/lib/integrations/bizapay";
import { getPlatformSettings } from "@/lib/platform-settings";

async function requirePlatformCeo() {
  const session = await getAuthSession();
  if (!session || !isPlatformCeoRole(session.user.role)) {
    throw new Error("Non autorisé");
  }
  return session;
}

export async function superAdminUpdateBusinessStatus(businessId: string, status: BusinessStatus) {
  await requirePlatformCeo();
  await prisma.business.update({
    where: { id: businessId },
    data: {
      status,
      verified: status === "ACTIVE",
    },
  });
  revalidatePath(CEO_DASHBOARD_PATH);
}

export async function superAdminValidateBusiness(businessId: string) {
  await requirePlatformCeo();
  await prisma.business.update({
    where: { id: businessId },
    data: { status: "ACTIVE", verified: true },
  });
  revalidatePath(CEO_DASHBOARD_PATH);
}

export async function superAdminDeleteBusiness(businessId: string) {
  await requirePlatformCeo();
  await prisma.$transaction(async (tx) => {
    const subs = await tx.subscription.findMany({
      where: { businessId },
      select: { id: true },
    });
    const subIds = subs.map((s) => s.id);
    if (subIds.length) {
      await tx.commission.deleteMany({ where: { subscriptionId: { in: subIds } } });
    }
    await tx.subscription.deleteMany({ where: { businessId } });
    await tx.payment.deleteMany({ where: { businessId } });
    await tx.report.deleteMany({ where: { businessId } });
    await tx.review.deleteMany({ where: { businessId } });
    await tx.promotion.deleteMany({ where: { businessId } });
    await tx.productService.deleteMany({ where: { businessId } });
    await tx.contactClickEvent.deleteMany({ where: { businessId } });
    await tx.businessViewEvent.deleteMany({ where: { businessId } });
    await tx.business.delete({ where: { id: businessId } });
  });
  revalidatePath(CEO_DASHBOARD_PATH);
}

export async function superAdminUpdateUserRole(userId: string, role: UserRole) {
  const session = await requirePlatformCeo();
  if (userId === session.user.id) {
    throw new Error("Impossible de modifier votre propre rôle.");
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (target?.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const otherAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN", NOT: { id: userId } } });
    if (otherAdmins < 1) {
      throw new Error("Conserver au moins un compte CEO (rôle technique SUPER_ADMIN).");
    }
  }
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  if (role === "AGENT") {
    const exists = await prisma.agentProfile.findUnique({ where: { userId } });
    if (!exists) {
      const settings = await getPlatformSettings();
      await prisma.agentProfile.create({
        data: {
          userId,
          code: `AG-${userId.slice(-8).toUpperCase()}`,
          commissionRate: settings.defaultAgentCommission,
        },
      });
    }
  }
  revalidatePath(CEO_DASHBOARD_PATH);
}

/** Sans champ isSuspended : rétrogradation en CLIENT (perte accès business/agent). */
export async function superAdminSuspendUser(userId: string) {
  const session = await requirePlatformCeo();
  if (userId === session.user.id) throw new Error("Action refusée.");
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (target?.role === "SUPER_ADMIN") {
    const otherAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN", NOT: { id: userId } } });
    if (otherAdmins < 1) throw new Error("Conserver au moins un compte CEO (rôle technique SUPER_ADMIN).");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { role: "CLIENT" },
  });
  revalidatePath(CEO_DASHBOARD_PATH);
}

export async function superAdminApprovePayment(paymentId: string, ceoComment?: string) {
  const session = await requirePlatformCeo();
  const result = await approveBizapayPayment(paymentId, session.user.id, ceoComment);
  if (!result.ok) throw new Error(result.error);
  revalidatePath(CEO_DASHBOARD_PATH);
  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/business/subscription");
  revalidatePath("/explore");
}

export async function superAdminUpdateReportStatus(reportId: string, status: ReportStatus) {
  await requirePlatformCeo();
  await prisma.report.update({
    where: { id: reportId },
    data: { status },
  });
  revalidatePath(CEO_DASHBOARD_PATH);
}

export async function superAdminRejectPayment(paymentId: string, ceoComment?: string) {
  const session = await requirePlatformCeo();
  const result = await rejectBizapayPayment(paymentId, session.user.id, ceoComment);
  if (!result.ok) throw new Error(result.error);
  revalidatePath(CEO_DASHBOARD_PATH);
  revalidatePath("/dashboard/business/subscription");
}

export async function superAdminDisableUrgentSale(productId: string) {
  await requirePlatformCeo();
  const p = await prisma.productService.findUnique({
    where: { id: productId },
    select: { id: true, originalPrice: true, price: true },
  });
  if (!p) throw new Error("Produit introuvable.");
  const restorePrice = p.originalPrice ?? p.price;
  await prisma.productService.update({
    where: { id: productId },
    data: {
      isUrgentSale: false,
      urgentSaleStatus: UrgentSaleStatus.CANCELLED,
      urgentSaleReason: null,
      urgentSaleEndsAt: null,
      urgentPrice: null,
      originalPrice: null,
      price: restorePrice,
    },
  });
  revalidatePath(CEO_DASHBOARD_PATH);
  revalidatePath("/explore");
  revalidatePath("/");
}
