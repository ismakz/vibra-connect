import { redirect } from "next/navigation";

/** Alias demandé : même espace que `/agent`. */
export default function DashboardAgentAliasPage() {
  redirect("/agent");
}
