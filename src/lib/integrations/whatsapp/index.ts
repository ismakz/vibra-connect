export function buildWhatsAppLink(phone: string, message?: string) {
  const cleanedPhone = phone.replace(/[^\d]/g, "");
  const text =
    message ??
    "Bonjour, je vous ai trouve sur VIBRA CONNECT. Je suis interesse par vos produits/services.";
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
}
