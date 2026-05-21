/**
 * Génère prisma/data/world-locations.ts depuis world-raw.json (REST Countries).
 * Exclut les pays déjà détaillés dans location-tree-data (Afrique centrale / Est).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SKIP_SLUGS = new Set([
  "rdc",
  "republique-democratique-du-congo",
  "congo-kinshasa",
  "rwanda",
  "burundi",
  "ouganda",
  "uganda",
  "kenya",
  "tanzanie",
  "tanzania",
]);

/** Villes supplémentaires connues (hors capitale API). */
const EXTRA_CITIES = {
  france: ["Lyon", "Marseille", "Toulouse"],
  germany: ["Hambourg", "Munich", "Cologne"],
  "united-states": ["New York", "Los Angeles", "Chicago"],
  "united-kingdom": ["Manchester", "Birmingham"],
  china: ["Shanghai", "Guangzhou", "Shenzhen"],
  india: ["Mumbai", "Bangalore", "Chennai"],
  brazil: ["Rio de Janeiro", "São Paulo", "Salvador"],
  canada: ["Toronto", "Montréal", "Vancouver"],
  australia: ["Sydney", "Melbourne", "Brisbane"],
  japan: ["Osaka", "Yokohama", "Nagoya"],
  italy: ["Milan", "Naples", "Turin"],
  spain: ["Barcelone", "Valence", "Séville"],
  nigeria: ["Lagos", "Kano", "Port Harcourt"],
  "south-africa": ["Le Cap", "Johannesburg", "Durban"],
  egypt: ["Alexandrie", "Gizeh"],
  morocco: ["Casablanca", "Marrakech", "Fès"],
  algeria: ["Oran", "Constantine"],
  senegal: ["Thiès", "Saint-Louis"],
  "ivory-coast": ["Bouaké", "San-Pédro"],
  ghana: ["Kumasi", "Tamale"],
  cameroon: ["Douala", "Garoua"],
  angola: ["Huambo", "Lubango"],
  mozambique: ["Beira", "Nampula"],
  zambia: ["Ndola", "Kitwe"],
  zimbabwe: ["Bulawayo", "Gweru"],
  mali: ["Sikasso", "Ségou"],
  niger: ["Zinder", "Maradi"],
  chad: ["Moundou", "Abéché"],
  "republic-of-the-congo": ["Pointe-Noire", "Dolisie"],
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(base, used) {
  let s = base;
  let i = 2;
  while (used.has(s)) {
    s = `${base}-${i}`;
    i += 1;
  }
  used.add(s);
  return s;
}

const raw = JSON.parse(fs.readFileSync(path.join(root, "prisma/data/world-raw.json"), "utf8"));
const usedCitySlugs = new Set();
const usedCountrySlugs = new Set(["rdc", "rwanda", "burundi", "ouganda", "kenya", "tanzanie"]);

const lines = [];
lines.push(`/** Généré par scripts/generate-world-locations.mjs — ne pas éditer à la main. */`);
lines.push(`import type { SeedCountry } from "../location-tree-data";`);
lines.push("");
lines.push(`export const WORLD_LOCATION_DATA: SeedCountry[] = [`);

let sortOrder = 10;
for (const row of raw) {
  let countrySlug = row.slug;
  if (countrySlug === "republique-democratique-du-congo") countrySlug = "rdc";
  if (SKIP_SLUGS.has(countrySlug) || usedCountrySlugs.has(countrySlug)) continue;
  usedCountrySlugs.add(countrySlug);

  const cities = [];
  const cap = row.cap?.trim();
  if (cap) cities.push(cap);
  const extras = EXTRA_CITIES[countrySlug] ?? [];
  for (const x of extras) {
    if (!cities.includes(x)) cities.push(x);
  }
  if (cities.length === 0) cities.push(row.n);

  const cityEntries = cities.slice(0, 5).map((name) => {
    const base = uniqueSlug(`${countrySlug}-${slugify(name)}`, usedCitySlugs);
    return `          { name: ${JSON.stringify(name)}, slug: ${JSON.stringify(base)} }`;
  });

  lines.push(`  {`);
  lines.push(`    name: ${JSON.stringify(row.n)},`);
  lines.push(`    slug: ${JSON.stringify(countrySlug)},`);
  lines.push(`    sortOrder: ${sortOrder},`);
  lines.push(`    provinces: [`);
  lines.push(`      {`);
  lines.push(`        name: "Territoire national",`);
  lines.push(`        slug: ${JSON.stringify(`${countrySlug}-national`)},`);
  lines.push(`        territories: [`);
  lines.push(`          {`);
  lines.push(`            name: "Principales localités",`);
  lines.push(`            slug: ${JSON.stringify(`${countrySlug}-local`)},`);
  lines.push(`            cities: [`);
  lines.push(cityEntries.join(",\n") + (cityEntries.length ? "," : ""));
  lines.push(`            ],`);
  lines.push(`          },`);
  lines.push(`        ],`);
  lines.push(`      },`);
  lines.push(`    ],`);
  lines.push(`  },`);
  sortOrder += 1;
}

lines.push(`];`);
lines.push("");

const outPath = path.join(root, "prisma/data/world-locations.ts");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath} (${sortOrder - 10} countries, ${usedCitySlugs.size} city slugs)`);
