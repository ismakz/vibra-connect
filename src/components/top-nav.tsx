import { TopNavClient, type TopNavUser } from "@/components/top-nav-client";
import { getAuthSession } from "@/lib/auth";
import { getBusinessHref } from "@/lib/nav-user";
import { prisma } from "@/lib/prisma";

export async function TopNav() {
  const session = await getAuthSession();
  const isAuthenticated = Boolean(session?.user?.id);
  const businessHref = getBusinessHref(session?.user?.role ?? null, isAuthenticated);

  if (!isAuthenticated || !session?.user?.id) {
    return <TopNavClient navUser={null} businessHref={businessHref} isAuthenticated={false} />;
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

  const hrefFromDb = getBusinessHref(navUser.role, true);

  return <TopNavClient navUser={navUser} businessHref={hrefFromDb} isAuthenticated />;
}
