import { guardCeoDashboard } from "@/lib/dashboard-guards";

export default async function CeoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardCeoDashboard();
  return children;
}
