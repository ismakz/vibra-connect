import { guardBusinessDashboard } from "@/lib/dashboard-guards";

export default async function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardBusinessDashboard();
  return children;
}
