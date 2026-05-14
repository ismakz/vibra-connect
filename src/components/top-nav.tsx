import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNavClient, type TopNavUser } from "@/components/top-nav-client";

export async function TopNav() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return <TopNavClient navUser={null} />;
  }

  const fallback: TopNavUser = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
    avatarUrl: null,
  };

  let navUser: TopNavUser = fallback;
  try {
    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    if (row) {
      navUser = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        avatarUrl: row.avatarUrl,
      };
    }
  } catch {
    navUser = fallback;
  }

  return <TopNavClient navUser={navUser} />;
}
