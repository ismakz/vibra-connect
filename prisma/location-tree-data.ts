/**
 * Hiérarchie Pays → Province → Ville (seed + référence métier).
 * Slugs villes uniques globalement (URLs / filtres marketplace).
 * Seed idempotent : upsert par slug pays / (pays, province) / ville.
 */
export type SeedCity = { name: string; slug: string };
export type SeedProvince = { name: string; slug: string; cities: SeedCity[] };
export type SeedCountry = { name: string; slug: string; sortOrder: number; provinces: SeedProvince[] };

export const LOCATION_TREE_DATA: SeedCountry[] = [
  {
    name: "RDC",
    slug: "rdc",
    sortOrder: 0,
    provinces: [
      { name: "Kinshasa", slug: "kinshasa", cities: [{ name: "Kinshasa", slug: "kinshasa" }] },
      {
        name: "Nord-Kivu",
        slug: "nord-kivu",
        cities: [
          { name: "Goma", slug: "goma" },
          { name: "Butembo", slug: "butembo" },
          { name: "Beni", slug: "beni" },
          { name: "Rutshuru", slug: "rutshuru" },
          { name: "Masisi", slug: "masisi" },
        ],
      },
      {
        name: "Sud-Kivu",
        slug: "sud-kivu",
        cities: [
          { name: "Bukavu", slug: "bukavu" },
          { name: "Uvira", slug: "uvira" },
          { name: "Kamituga", slug: "kamituga" },
        ],
      },
      {
        name: "Ituri",
        slug: "ituri",
        cities: [
          { name: "Bunia", slug: "bunia" },
          { name: "Mahagi", slug: "mahagi" },
        ],
      },
      { name: "Tshopo", slug: "tshopo", cities: [{ name: "Kisangani", slug: "kisangani" }] },
      {
        name: "Haut-Katanga",
        slug: "haut-katanga",
        cities: [
          { name: "Lubumbashi", slug: "lubumbashi" },
          { name: "Likasi", slug: "likasi" },
        ],
      },
      { name: "Lualaba", slug: "lualaba", cities: [{ name: "Kolwezi", slug: "kolwezi" }, { name: "Fungurume", slug: "fungurume" }] },
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
    ],
  },
  {
    name: "Rwanda",
    slug: "rwanda",
    sortOrder: 1,
    provinces: [
      { name: "Kigali", slug: "kigali", cities: [{ name: "Kigali", slug: "kigali" }] },
      {
        name: "Nord",
        slug: "nord",
        cities: [{ name: "Musanze", slug: "musanze-nord" }, { name: "Nyabihu", slug: "nyabihu" }],
      },
      { name: "Sud", slug: "sud", cities: [{ name: "Huye", slug: "huye" }, { name: "Nyanza", slug: "nyanza-rw" }] },
      {
        name: "Est",
        slug: "est",
        cities: [
          { name: "Rwamagana", slug: "rwamagana" },
          { name: "Kayonza", slug: "kayonza" },
        ],
      },
      {
        name: "Ouest",
        slug: "ouest",
        cities: [
          { name: "Rubavu", slug: "rubavu" },
          { name: "Gisenyi", slug: "gisenyi" },
          { name: "Karongi", slug: "karongi" },
          { name: "Musanze", slug: "musanze" },
        ],
      },
    ],
  },
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
      {
        name: "Central",
        slug: "ug-central",
        cities: [
          { name: "Kampala", slug: "kampala" },
          { name: "Entebbe", slug: "entebbe" },
        ],
      },
      {
        name: "Western",
        slug: "ug-western",
        cities: [
          { name: "Mbarara", slug: "mbarara" },
          { name: "Fort Portal", slug: "fort-portal" },
        ],
      },
      {
        name: "Eastern",
        slug: "ug-eastern",
        cities: [
          { name: "Jinja", slug: "jinja" },
          { name: "Mbale", slug: "mbale" },
        ],
      },
      {
        name: "Northern",
        slug: "ug-northern",
        cities: [
          { name: "Gulu", slug: "gulu" },
          { name: "Lira", slug: "lira" },
        ],
      },
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
      {
        name: "Dar es Salaam",
        slug: "dar-es-salaam",
        cities: [
          { name: "Dar es Salaam", slug: "dar-es-salaam" },
          { name: "Kinondoni", slug: "kinondoni" },
        ],
      },
      { name: "Arusha", slug: "arusha", cities: [{ name: "Arusha", slug: "arusha" }, { name: "Meru", slug: "meru" }] },
      { name: "Mwanza", slug: "mwanza", cities: [{ name: "Mwanza", slug: "mwanza" }] },
      { name: "Dodoma", slug: "dodoma", cities: [{ name: "Dodoma", slug: "dodoma" }] },
      { name: "Mbeya", slug: "mbeya", cities: [{ name: "Mbeya", slug: "mbeya-ville" }] },
      { name: "Kigoma", slug: "kigoma", cities: [{ name: "Kigoma", slug: "kigoma-ville" }] },
    ],
  },
];
