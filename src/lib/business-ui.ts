import { buildWhatsAppLink } from "@/lib/integrations/whatsapp";

type BusinessImageLike = {
  name: string;
  slug?: string | null;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  category?: { name?: string | null } | null;
  city?: { name?: string | null } | null;
};

export function hashStringToInt(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 1000000;
  return h;
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value.replace(/&/g, "&amp;");
}

export function isDataImage(src: string) {
  return src.startsWith("data:");
}

export function isBusinessSponsored(featuredUntil: Date | null | undefined, now = new Date()) {
  return featuredUntil ? featuredUntil.getTime() > now.getTime() : false;
}

export function isBusinessOpen(openingHours: string | null | undefined, now = new Date(), seed = "") {
  if (!openingHours) {
    const hour = now.getHours();
    return hour >= 8 && hour <= 19 && hashStringToInt(seed || "vibra") % 2 === 0;
  }

  const text = openingHours.toLowerCase();
  if (text.includes("24/7") || text.includes("24h") || text.includes("toute la journée")) return true;

  const match = openingHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    const hour = now.getHours();
    return hour >= 8 && hour <= 19 && hashStringToInt(seed || openingHours) % 3 !== 0;
  }

  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const current = now.getHours() * 60 + now.getMinutes();

  if (end === start) return true;
  if (end < start) return current >= start || current <= end;
  return current >= start && current <= end;
}

export function formatRating(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Nouveau";
  return value.toFixed(1);
}

export function fallbackPhone(slug: string) {
  const h = hashStringToInt(slug);
  const prefix = h % 3 === 0 ? "2438" : h % 3 === 1 ? "2439" : "2507";
  const suffix = (h % 1000000000).toString().padStart(9, "0");
  return `${prefix}${suffix}`.slice(0, 13);
}

export function fallbackRating(slug: string) {
  const h = hashStringToInt(slug);
  const value = 3.7 + (h % 130) / 100;
  return Math.round(value * 10) / 10;
}

export function distanceKm(slug: string) {
  const h = hashStringToInt(slug);
  return Math.round((0.5 + (h % 950) / 100) * 10) / 10;
}

export function buildWhatsAppMessage(businessName: string) {
  return `Bonjour, je vous ai trouvé sur VIBRA CONNECT (${businessName}). Je souhaite en savoir plus sur vos offres.`;
}

export function buildWhatsAppUrl(phone: string, businessName: string) {
  return buildWhatsAppLink(phone, buildWhatsAppMessage(businessName));
}

export function getBusinessCoverImage(business: BusinessImageLike) {
  if (business.bannerUrl) return business.bannerUrl;

  const name = business.name || "Business local";
  const category = business.category?.name || "Services";
  const city = business.city?.name || "Ville";
  const h = hashStringToInt(`${name}|${category}|${city}`);
  const hueA = h % 360;
  const hueB = (hueA + 68) % 360;

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="620" viewBox="0 0 1600 620">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hueA} 95% 65%)" stop-opacity="0.55"/>
          <stop offset="1" stop-color="hsl(${hueB} 95% 65%)" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="620" fill="url(#bg)" />
      <g opacity="0.35">
        <circle cx="${240 + (h % 250)}" cy="${160 + (h % 190)}" r="160" fill="#22d3ee"/>
        <circle cx="${1140 + (h % 200)}" cy="${220 + (h % 180)}" r="220" fill="#a78bfa"/>
      </g>
      <rect x="0" y="430" width="1600" height="190" fill="rgba(5,8,22,0.45)"/>
      <text x="80" y="500" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="800" fill="#F8FAFC">${escapeSvgText(name)}</text>
      <text x="80" y="548" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="rgba(226,232,240,0.85)">${escapeSvgText(category)} • ${escapeSvgText(city)}</text>
    </svg>
  `.trim());
}

export function getBusinessLogoImage(business: BusinessImageLike) {
  if (business.logoUrl) return business.logoUrl;

  const initials =
    business.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "VC";

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
      <defs>
        <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#22d3ee"/>
          <stop offset="1" stop-color="#a78bfa"/>
        </linearGradient>
      </defs>
      <circle cx="110" cy="110" r="106" fill="url(#logo)" />
      <circle cx="110" cy="110" r="98" fill="rgba(5,8,22,0.35)" />
      <text x="110" y="130" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" fill="#F8FAFC">${initials.slice(0, 2)}</text>
    </svg>
  `.trim());
}
