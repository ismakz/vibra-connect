/**
 * Hiérarchie Pays → Province/Région → Territoire/Zone → Ville/Commune.
 * Slugs villes uniques globalement. Seed idempotent (upsert).
 */
export type SeedCity = { name: string; slug: string };
export type SeedTerritory = { name: string; slug: string; cities: SeedCity[] };
export type SeedProvince = {
  name: string;
  slug: string;
  /** Territoires / districts / zones */
  territories?: SeedTerritory[];
  /** Villes rattachées directement à la province (sans territoire) — rétrocompat seed */
  cities?: SeedCity[];
};
export type SeedCountry = { name: string; slug: string; sortOrder: number; provinces: SeedProvince[] };

/** RDC — provinces détaillées (extrait demandé + autres provinces en territoire « Localités »). */
const RDC_PROVINCES: SeedProvince[] = [
  {
    name: "Kinshasa",
    slug: "kinshasa",
    territories: [
      {
        name: "Lukunga",
        slug: "lukunga",
        cities: [
          { name: "Gombe", slug: "gombe" },
          { name: "Ngaliema", slug: "ngaliema" },
          { name: "Kintambo", slug: "kintambo" },
          { name: "Limete", slug: "limete" },
        ],
      },
      {
        name: "Funa",
        slug: "funa",
        cities: [
          { name: "Bandalungwa", slug: "bandalungwa" },
          { name: "Kalamu", slug: "kalamu" },
          { name: "Matete", slug: "matete" },
        ],
      },
      {
        name: "Mont-Amba",
        slug: "mont-amba",
        cities: [
          { name: "Masina", slug: "masina" },
          { name: "N'djili", slug: "ndjili" },
        ],
      },
      {
        name: "Tshangu",
        slug: "tshangu",
        cities: [
          { name: "Kimbanseke", slug: "kimbanseke" },
          { name: "Nsele", slug: "nsele" },
        ],
      },
    ],
  },
  {
    name: "Nord-Kivu",
    slug: "nord-kivu",
    territories: [
      {
        name: "Nyiragongo",
        slug: "nyiragongo",
        cities: [
          { name: "Goma", slug: "goma" },
          { name: "Sake", slug: "sake" },
        ],
      },
      {
        name: "Rutshuru",
        slug: "rutshuru",
        cities: [
          { name: "Rutshuru", slug: "rutshuru" },
          { name: "Kiwanja", slug: "kiwanja" },
        ],
      },
      { name: "Masisi", slug: "masisi", cities: [{ name: "Masisi", slug: "masisi-ville" }] },
      { name: "Walikale", slug: "walikale", cities: [{ name: "Walikale", slug: "walikale" }] },
      { name: "Lubero", slug: "lubero", cities: [{ name: "Lubero", slug: "lubero" }] },
      { name: "Beni", slug: "beni-territoire", cities: [{ name: "Beni", slug: "beni" }, { name: "Butembo", slug: "butembo" }] },
    ],
  },
  {
    name: "Sud-Kivu",
    slug: "sud-kivu",
    territories: [
      { name: "Kabare", slug: "kabare", cities: [{ name: "Kavumu", slug: "kavumu" }] },
      { name: "Walungu", slug: "walungu", cities: [{ name: "Bukavu", slug: "bukavu" }] },
      { name: "Kalehe", slug: "kalehe", cities: [{ name: "Kalehe", slug: "kalehe" }] },
      { name: "Uvira", slug: "uvira-territoire", cities: [{ name: "Uvira", slug: "uvira" }] },
      { name: "Fizi", slug: "fizi", cities: [{ name: "Baraka", slug: "baraka" }] },
      { name: "Mwenga", slug: "mwenga", cities: [{ name: "Kamituga", slug: "kamituga" }] },
      { name: "Shabunda", slug: "shabunda", cities: [{ name: "Shabunda", slug: "shabunda" }] },
      { name: "Idjwi", slug: "idjwi", cities: [{ name: "Idjwi", slug: "idjwi" }] },
    ],
  },
  {
    name: "Ituri",
    slug: "ituri",
    territories: [
      { name: "Irumu", slug: "irumu", cities: [{ name: "Bunia", slug: "bunia" }] },
      { name: "Djugu", slug: "djugu", cities: [{ name: "Djugu", slug: "djugu-ville" }] },
      { name: "Mahagi", slug: "mahagi-territoire", cities: [{ name: "Mahagi", slug: "mahagi" }] },
      { name: "Aru", slug: "aru-territoire", cities: [{ name: "Aru", slug: "aru" }] },
      { name: "Mambasa", slug: "mambasa-territoire", cities: [{ name: "Mambasa", slug: "mambasa" }] },
    ],
  },
  {
    name: "Haut-Katanga",
    slug: "haut-katanga",
    territories: [
      { name: "Lubumbashi", slug: "lubumbashi-territoire", cities: [{ name: "Lubumbashi", slug: "lubumbashi" }] },
      { name: "Kipushi", slug: "kipushi", cities: [{ name: "Kipushi", slug: "kipushi" }] },
      { name: "Kambove", slug: "kambove", cities: [{ name: "Kambove", slug: "kambove" }] },
      { name: "Kasenga", slug: "kasenga", cities: [{ name: "Kasenga", slug: "kasenga" }] },
      { name: "Mitwaba", slug: "mitwaba", cities: [{ name: "Mitwaba", slug: "mitwaba" }] },
      { name: "Pweto", slug: "pweto", cities: [{ name: "Pweto", slug: "pweto" }] },
      { name: "Likasi", slug: "likasi-territoire", cities: [{ name: "Likasi", slug: "likasi" }] },
      { name: "Kasumbalesa", slug: "kasumbalesa-territoire", cities: [{ name: "Kasumbalesa", slug: "kasumbalesa" }] },
    ],
  },
  {
    name: "Lualaba",
    slug: "lualaba",
    territories: [
      { name: "Kolwezi", slug: "kolwezi-territoire", cities: [{ name: "Kolwezi", slug: "kolwezi" }] },
      { name: "Mutshatsha", slug: "mutshatsha", cities: [{ name: "Mutshatsha", slug: "mutshatsha" }] },
      { name: "Lubudi", slug: "lubudi", cities: [{ name: "Lubudi", slug: "lubudi" }] },
      { name: "Dilolo", slug: "dilolo-territoire", cities: [{ name: "Dilolo", slug: "dilolo" }] },
      { name: "Kapanga", slug: "kapanga", cities: [{ name: "Kapanga", slug: "kapanga" }] },
      { name: "Sandoa", slug: "sandoa", cities: [{ name: "Sandoa", slug: "sandoa" }] },
      { name: "Fungurume", slug: "fungurume-territoire", cities: [{ name: "Fungurume", slug: "fungurume" }] },
    ],
  },
  { name: "Tshopo", slug: "tshopo", cities: [{ name: "Kisangani", slug: "kisangani" }] },
  {
    name: "Kongo Central",
    slug: "kongo-central",
    cities: [
      { name: "Matadi", slug: "matadi" },
      { name: "Boma", slug: "boma" },
    ],
  },
  { name: "Tanganyika", slug: "tanganyika", cities: [{ name: "Kalemie", slug: "kalemie" }, { name: "Kongolo", slug: "kongolo" }] },
  { name: "Maniema", slug: "maniema", cities: [{ name: "Kindu", slug: "kindu" }, { name: "Kasongo", slug: "kasongo" }] },
  { name: "Kasaï", slug: "kasai", cities: [{ name: "Tshikapa", slug: "tshikapa" }, { name: "Ilebo", slug: "ilebo" }] },
  { name: "Kasaï-Central", slug: "kasai-central", cities: [{ name: "Kananga", slug: "kananga" }, { name: "Dimbelenge", slug: "dimbelenge" }] },
  {
    name: "Kasaï-Oriental",
    slug: "kasai-oriental",
    cities: [
      { name: "Mbuji-Mayi", slug: "mbuji-mayi" },
      { name: "Mweka", slug: "mweka" },
    ],
  },
  { name: "Équateur", slug: "equateur", cities: [{ name: "Mbandaka", slug: "mbandaka" }, { name: "Lukolela", slug: "lukolela" }] },
  { name: "Nord-Ubangi", slug: "nord-ubangi", cities: [{ name: "Gbadolite", slug: "gbadolite" }, { name: "Bosobolo", slug: "bosobolo" }] },
  { name: "Sud-Ubangi", slug: "sud-ubangi", cities: [{ name: "Gemena", slug: "gemena" }, { name: "Budjala", slug: "budjala" }] },
  { name: "Mongala", slug: "mongala", cities: [{ name: "Lisala", slug: "lisala" }, { name: "Bumba", slug: "bumba" }] },
  { name: "Tshuapa", slug: "tshuapa", cities: [{ name: "Boende", slug: "boende" }] },
  { name: "Kwilu", slug: "kwilu", cities: [{ name: "Kikwit", slug: "kikwit" }, { name: "Bandundu", slug: "bandundu" }] },
  { name: "Kwango", slug: "kwango", cities: [{ name: "Kenge", slug: "kenge" }, { name: "Popokabaka", slug: "popokabaka" }] },
  { name: "Mai-Ndombe", slug: "mai-ndombe", cities: [{ name: "Inongo", slug: "inongo" }, { name: "Kiri", slug: "kiri" }] },
  { name: "Lomami", slug: "lomami", cities: [{ name: "Kabinda", slug: "kabinda" }, { name: "Mwene-Ditu", slug: "mwene-ditu" }] },
  { name: "Haut-Lomami", slug: "haut-lomami", cities: [{ name: "Kamina", slug: "kamina" }, { name: "Bukama", slug: "bukama" }] },
  { name: "Sankuru", slug: "sankuru", cities: [{ name: "Lusambo", slug: "lusambo" }, { name: "Lodja", slug: "lodja" }] },
  { name: "Bas-Uele", slug: "bas-uele", cities: [{ name: "Buta", slug: "buta" }, { name: "Bondo", slug: "bondo" }] },
  { name: "Haut-Uele", slug: "haut-uele", cities: [{ name: "Isiro", slug: "isiro" }, { name: "Watsa", slug: "watsa" }] },
];

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

export const LOCATION_TREE_DATA: SeedCountry[] = [
  { name: "RDC", slug: "rdc", sortOrder: 0, provinces: RDC_PROVINCES },
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
