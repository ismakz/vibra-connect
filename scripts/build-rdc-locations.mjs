/**
 * Compile prisma/data/rdc-territories-source.json → prisma/data/rdc-locations.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slugs villes RDC déjà connus (ne pas casser les business existants). */
const CITY_SLUG_OVERRIDES = {
  Masisi: "masisi-ville",
  "N'djili": "ndjili",
  "N'djili": "ndjili",
  Djugu: "djugu-ville",
  Beni: "beni",
  "Beni (territoire)": "beni",
  Uvira: "uvira",
  Lubumbashi: "lubumbashi",
  Kolwezi: "kolwezi",
  Likasi: "likasi",
  Kasumbalesa: "kasumbalesa",
  Dilolo: "dilolo",
  Fungurume: "fungurume",
  Mahagi: "mahagi",
  Aru: "aru",
  Mambasa: "mambasa",
  Rutshuru: "rutshuru",
  Kalehe: "kalehe",
  Kamituga: "kamituga",
  Baraka: "baraka",
  Shabunda: "shabunda",
  Idjwi: "idjwi",
  Kavumu: "kavumu",
  Bukavu: "bukavu",
  Goma: "goma",
  Sake: "sake",
  Butembo: "butembo",
  Kiwanja: "kiwanja",
  Walikale: "walikale",
  Lubero: "lubero",
  Kipushi: "kipushi",
  Kambove: "kambove",
  Kasenga: "kasenga",
  Mitwaba: "mitwaba",
  Pweto: "pweto",
  Mutshatsha: "mutshatsha",
  Lubudi: "lubudi",
  Kapanga: "kapanga",
  Sandoa: "sandoa",
};

const usedCitySlugs = new Set();

function citySlug(name, territorySlug) {
  if (CITY_SLUG_OVERRIDES[name]) {
    const s = CITY_SLUG_OVERRIDES[name];
    usedCitySlugs.add(s);
    return s;
  }
  let base = slugify(name);
  if (usedCitySlugs.has(base)) base = `${territorySlug}-${base}`;
  let s = base;
  let i = 2;
  while (usedCitySlugs.has(s)) {
    s = `${base}-${i}`;
    i += 1;
  }
  usedCitySlugs.add(s);
  return s;
}

const source = JSON.parse(
  fs.readFileSync(path.join(root, "prisma/data/rdc-territories-source.json"), "utf8"),
);

const lines = [];
lines.push(`/** RDC — 26 provinces, territoires et localités (généré depuis rdc-territories-source.json). */`);
lines.push(`import type { SeedProvince } from "../location-tree-data";`);
lines.push("");
lines.push(`export const RDC_LOCATION_PROVINCES: SeedProvince[] = [`);

for (const prov of source) {
  lines.push(`  {`);
  lines.push(`    name: ${JSON.stringify(prov.name)},`);
  lines.push(`    slug: ${JSON.stringify(prov.slug)},`);
  if (prov.territories?.length) {
    lines.push(`    territories: [`);
    for (const terr of prov.territories) {
      const terrSlug = terr.slug || slugify(terr.name);
      lines.push(`      {`);
      lines.push(`        name: ${JSON.stringify(terr.name)},`);
      lines.push(`        slug: ${JSON.stringify(terrSlug)},`);
      lines.push(`        cities: [`);
      const cities = terr.cities ?? [terr.name];
      for (const cityName of cities) {
        const cs = citySlug(cityName, terrSlug);
        lines.push(`          { name: ${JSON.stringify(cityName)}, slug: ${JSON.stringify(cs)} },`);
      }
      lines.push(`        ],`);
      lines.push(`      },`);
    }
    lines.push(`    ],`);
  }
  if (prov.cities?.length) {
    lines.push(`    cities: [`);
    for (const cityName of prov.cities) {
      const cs = citySlug(cityName, prov.slug);
      lines.push(`      { name: ${JSON.stringify(cityName)}, slug: ${JSON.stringify(cs)} },`);
    }
    lines.push(`    ],`);
  }
  lines.push(`  },`);
}

lines.push(`];`);
lines.push("");

fs.writeFileSync(path.join(root, "prisma/data/rdc-locations.ts"), lines.join("\n"), "utf8");
console.log(`RDC provinces: ${source.length}, unique city slugs: ${usedCitySlugs.size}`);
