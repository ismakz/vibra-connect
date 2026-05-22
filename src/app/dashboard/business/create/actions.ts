"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { isPlatformCeoRole } from "@/lib/ceo-platform";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function createFirstBusinessAction(formData: FormData) {
  const current = await getAuthSession();
  if (!current) return;
  const role = current.user.role;
  const canCreate =
    role === "CLIENT" || role === "BUSINESS_OWNER" || isPlatformCeoRole(role);
  if (!canCreate) return;

  const existing = await prisma.business.count({ where: { ownerId: current.user.id } });
  if (existing > 0) {
    redirect("/dashboard/business");
  }

  const name = formData.get("name")?.toString() ?? "";
  const cityId = formData.get("cityId")?.toString() ?? "";
  const categoryId = formData.get("categoryId")?.toString() ?? "";
  if (!name.trim() || !cityId || !categoryId) {
    redirect("/dashboard/business/create?error=champs_requis");
  }

  const baseSlug = slugify(name);
  const exists = await prisma.business.count({ where: { slug: { startsWith: baseSlug } } });
  const slug = exists > 0 ? `${baseSlug}-${exists + 1}` : baseSlug;

  const owner = await prisma.user.findUnique({
    where: { id: current.user.id },
    select: { referredByAgentId: true },
  });
  const agentProfile = owner?.referredByAgentId
    ? await prisma.agentProfile.findUnique({
        where: { id: owner.referredByAgentId },
        select: { id: true, userId: true },
      })
    : null;
  const referralAgentId = agentProfile && agentProfile.userId !== current.user.id ? agentProfile.id : null;

  await prisma.$transaction(async (tx) => {
    await tx.business.create({
      data: {
        name,
        slug,
        cityId,
        categoryId,
        ownerId: current.user.id,
        status: "PENDING",
        referralAgentId,
      },
    });
    if (current.user.role === "CLIENT") {
      await tx.user.update({
        where: { id: current.user.id },
        data: { role: UserRole.BUSINESS_OWNER },
      });
    }
    if (referralAgentId) {
      await tx.agentProfile.update({
        where: { id: referralAgentId },
        data: { totalRecruited: { increment: 1 } },
      });
    }
  });

  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/business/create");
  redirect("/dashboard/business");
}
