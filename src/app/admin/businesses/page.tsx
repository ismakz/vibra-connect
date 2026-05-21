import { redirect } from "next/navigation";
import { BusinessStatus } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { selectAdminCompact } from "@/lib/select-classes";

export default async function AdminBusinessesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/");

  const businesses = await prisma.business.findMany({
    include: { city: true, category: true, owner: true },
    orderBy: { createdAt: "desc" },
  });

  async function updateBusinessStatus(formData: FormData) {
    "use server";
    const session = await getAuthSession();
    if (!session || session.user.role !== "SUPER_ADMIN") return;
    const businessId = formData.get("businessId")?.toString();
    const status = formData.get("status")?.toString();
    if (!businessId || !status) return;
    if (!Object.values(BusinessStatus).includes(status as BusinessStatus)) return;
    await prisma.business.update({
      where: { id: businessId },
      data: { status: status as BusinessStatus, verified: status === "ACTIVE" },
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Gestion business</h1>
      <div className="mt-4 space-y-3">
        {businesses.map((business) => (
          <article key={business.id} className="glass rounded-xl p-4">
            <h2 className="font-semibold">{business.name}</h2>
            <p className="text-sm text-white/70">{business.owner.email} - {business.city.name} - {business.category.name}</p>
            <p className="text-sm">Statut: {business.status}</p>
            <form action={updateBusinessStatus} className="mt-2 flex gap-2">
              <input type="hidden" name="businessId" value={business.id} />
              <select name="status" className={`${selectAdminCompact} min-w-[9rem]`}>
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <button className="rounded-lg bg-cyan-500 px-3 py-1 text-sm text-black">Mettre a jour</button>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
