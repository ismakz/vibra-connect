/**
 * Hiérarchie Pays → Province/Région → Territoire/Zone → Ville/Commune.
 * Slugs villes uniques globalement. Seed idempotent (upsert).
 */
import { RDC_LOCATION_PROVINCES } from "./data/rdc-locations";

export type SeedCity = { name: string; slug: string };
export type SeedTerritory = { name: string; slug: string; cities: SeedCity[] };
export type SeedProvince = {
  name: string;
  slug: string;
  territories?: SeedTerritory[];
  cities?: SeedCity[];
};
export type SeedCountry = { name: string; slug: string; sortOrder: number; provinces: SeedProvince[] };

const RWANDA_PROVINCES: SeedProvince[] = [
  {
    name: "Kigali",
    slug: "kigali",
    territories: [
      { name: "Gasabo", slug: "gasabo", cities: [{ name: "Kigali (Gasabo)", slug: "kigali-gasabo" }, { name: "Remera", slug: "remera" }] },
      { name: "Kicukiro", slug: "kicukiro", cities: [{ name: "Kicukiro", slug: "kicukiro" }] },
      { name: "Nyarugenge", slug: "nyarugenge", cities: [{ name: "Nyarugenge", slug: "nyarugenge" }] },
    ],
  },
  {
    name: "Nord",
    slug: "nord",
    territories: [
      { name: "Musanze", slug: "musanze-district", cities: [{ name: "Musanze", slug: "musanze-nord" }] },
      { name: "Gicumbi", slug: "gicumbi", cities: [{ name: "Byumba", slug: "byumba" }] },
      { name: "Burera", slug: "burera", cities: [{ name: "Burera", slug: "burera" }] },
    ],
  },
  {
    name: "Sud",
    slug: "sud",
    territories: [
      { name: "Huye", slug: "huye-district", cities: [{ name: "Huye", slug: "huye" }] },
      { name: "Muhanga", slug: "muhanga", cities: [{ name: "Muhanga", slug: "muhanga" }] },
      { name: "Nyanza", slug: "nyanza-district", cities: [{ name: "Nyanza", slug: "nyanza-rw" }] },
    ],
  },
  {
    name: "Est",
    slug: "est",
    territories: [
      { name: "Rwamagana", slug: "rwamagana-district", cities: [{ name: "Rwamagana", slug: "rwamagana" }] },
      { name: "Kayonza", slug: "kayonza-district", cities: [{ name: "Kayonza", slug: "kayonza" }] },
      { name: "Nyagatare", slug: "nyagatare", cities: [{ name: "Nyagatare", slug: "nyagatare" }] },
    ],
  },
  {
    name: "Ouest",
    slug: "ouest",
    territories: [
      { name: "Rubavu", slug: "rubavu-district", cities: [{ name: "Rubavu", slug: "rubavu" }, { name: "Gisenyi", slug: "gisenyi" }] },
      { name: "Rusizi", slug: "rusizi", cities: [{ name: "Rusizi", slug: "rusizi" }] },
      { name: "Karongi", slug: "karongi-district", cities: [{ name: "Karongi", slug: "karongi" }] },
      { name: "Nyamasheke", slug: "nyamasheke", cities: [{ name: "Nyamasheke", slug: "nyamasheke" }] },
    ],
  },
];

/** Pays prioritaires (Afrique centrale / Est) — détail manuel. */
const AFRICA_PRIORITY: SeedCountry[] = [
  { name: "RDC", slug: "rdc", sortOrder: 0, provinces: RDC_LOCATION_PROVINCES },
  { name: "Rwanda", slug: "rwanda", sortOrder: 1, provinces: RWANDA_PROVINCES },
  {
    name: "Burundi",
    slug: "burundi",
    sortOrder: 2,
    provinces: [
      { name: "Bujumbura Mairie", slug: "bujumbura-mairie", cities: [{ name: "Bujumbura", slug: "bujumbura" }] },
      { name: "Bujumbura Rural", slug: "bujumbura-rural", cities: [{ name: "Isale", slug: "isale" }, { name: "Mutimbuzi", slug: "mutimbuzi" }] },
      { name: "Gitega", slug: "gitega-prov", cities: [{ name: "Gitega", slug: "gitega" }] },
      { name: "Ngozi", slug: "ngozi", cities: [{ name: "Ngozi", slug: "ngozi-ville" }] },
      { name: "Muyinga", slug: "muyinga", cities: [{ name: "Muyinga", slug: "muyinga-ville" }] },
      { name: "Rumonge", slug: "rumonge", cities: [{ name: "Rumonge", slug: "rumonge-ville" }] },
      { name: "Makamba", slug: "makamba", cities: [{ name: "Makamba", slug: "makamba-ville" }] },
      { name: "Bururi", slug: "bururi", cities: [{ name: "Bururi", slug: "bururi-ville" }] },
      { name: "Cibitoke", slug: "cibitoke", cities: [{ name: "Cibitoke", slug: "cibitoke-ville" }] },
      { name: "Kayanza", slug: "kayanza", cities: [{ name: "Kayanza", slug: "kayanza-ville" }] },
    ],
  },
  {
    name: "Ouganda",
    slug: "ouganda",
    sortOrder: 3,
    provinces: [
      { name: "Central", slug: "ug-central", cities: [{ name: "Kampala", slug: "kampala" }, { name: "Entebbe", slug: "entebbe" }] },
      { name: "Western", slug: "ug-western", cities: [{ name: "Mbarara", slug: "mbarara" }, { name: "Fort Portal", slug: "fort-portal" }] },
      { name: "Eastern", slug: "ug-eastern", cities: [{ name: "Jinja", slug: "jinja" }, { name: "Mbale", slug: "mbale" }] },
      { name: "Northern", slug: "ug-northern", cities: [{ name: "Gulu", slug: "gulu" }, { name: "Lira", slug: "lira" }] },
    ],
  },
  {
    name: "Kenya",
    slug: "kenya",
    sortOrder: 4,
    provinces: [
      { name: "Nairobi", slug: "nairobi-county", cities: [{ name: "Nairobi", slug: "nairobi" }, { name: "Westlands", slug: "westlands" }] },
      { name: "Mombasa", slug: "mombasa-county", cities: [{ name: "Mombasa", slug: "mombasa" }, { name: "Likoni", slug: "likoni" }] },
      { name: "Kisumu", slug: "kisumu-county", cities: [{ name: "Kisumu", slug: "kisumu" }] },
      { name: "Nakuru", slug: "nakuru-county", cities: [{ name: "Nakuru", slug: "nakuru" }] },
      { name: "Kiambu", slug: "kiambu-county", cities: [{ name: "Kiambu", slug: "kiambu" }, { name: "Thika", slug: "thika" }] },
      { name: "Uasin Gishu", slug: "uasin-gishu", cities: [{ name: "Eldoret", slug: "eldoret" }] },
      { name: "Machakos", slug: "machakos-county", cities: [{ name: "Machakos", slug: "machakos" }, { name: "Athi River", slug: "athi-river" }] },
    ],
  },
  {
    name: "Tanzanie",
    slug: "tanzanie",
    sortOrder: 5,
    provinces: [
      { name: "Dar es Salaam", slug: "dar-es-salaam", cities: [{ name: "Dar es Salaam", slug: "dar-es-salaam" }, { name: "Kinondoni", slug: "kinondoni" }] },
      { name: "Arusha", slug: "arusha", cities: [{ name: "Arusha", slug: "arusha" }, { name: "Meru", slug: "meru" }] },
      { name: "Mwanza", slug: "mwanza", cities: [{ name: "Mwanza", slug: "mwanza" }] },
      { name: "Dodoma", slug: "dodoma", cities: [{ name: "Dodoma", slug: "dodoma" }] },
      { name: "Mbeya", slug: "mbeya", cities: [{ name: "Mbeya", slug: "mbeya-ville" }] },
      { name: "Kigoma", slug: "kigoma", cities: [{ name: "Kigoma", slug: "kigoma-ville" }] },
    ],
  },
];

// Import dynamique du monde généré (évite erreur si fichier absent avant génération)
import { WORLD_LOCATION_DATA } from "./data/world-locations";

export const LOCATION_TREE_DATA: SeedCountry[] = [...AFRICA_PRIORITY, ...WORLD_LOCATION_DATA];
