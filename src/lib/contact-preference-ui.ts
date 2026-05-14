import type { ContactPreference } from "@prisma/client";

const LABELS: Record<ContactPreference, string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Téléphone",
  BIZAFLOW_TELECOM: "Bizaflow Telecom",
  INTERNAL_MESSAGE: "Message interne",
  EMAIL: "Email",
};

export function contactPreferenceLabel(p: ContactPreference): string {
  return LABELS[p] ?? p;
}
