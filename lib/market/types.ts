/* Shapes for the market payload. Deliberately geography-generic:
   nothing here names a city, and every lookup runs city → district →
   outlet. The Erbil build hard-coded one city into the rules
   themselves — district adjacency, a fixed centroid — which is exactly
   what made a second city impossible to add. */

export type Health = "good" | "warn" | "critical" | "neutral";

export type Contract = {
  client: string;
  clientShort: string;
  brand: string;
  country: string;
  category: string;
  currency: string;
  contractedPos: number;
  visitedThisMonth: number;
  coveragePct: number;
  remaining: number;
  daysRemaining: number;
  daysElapsed: number;
  currentMonth: string;
  corePanel: number;
};

export type Month = {
  id: string;
  label: string;
  short: string;
  days: number;
  current?: boolean;
  /* A cycle after the current one. It carries audit data so a
     follow-up request has somewhere to land, but the portal presents
     it as planned rather than historical — the future is modelled, not
     known. */
  planned?: boolean;
};

export type City = {
  id: string;
  /* The governorate's own name. Five of the six match their capital;
     Nineveh does not, and calling that row "Mosul" under a column
     headed Governorate is an error an Iraqi reader spots at once. */
  name: string;
  capital: string;
  lat: number;
  lng: number;
  /* Projected for the map, same projection the marketing site uses. */
  x: number;
  y: number;
  pos: number;
  tier: "capital" | "major" | "mid";
};

export type District = { cityId: string; name: string };
export type Channel = { id: string; name: string; size: number };

export type Brand = {
  id: string;
  name: string;
  owner: string;
  client: boolean;
  strength: number;
};

export type Sku = {
  id: string;
  brandId: string;
  pack: string;
  name: string;
  rrp: number;
};

export type Pos = {
  id: string;
  code: string;
  name: string;
  cityId: string;
  district: string;
  channel: string;
  retailer: string;
  volume: number;
  /* Synthetic placement: the city and district are real, the point
     inside the district is plausible rather than surveyed. Every
     surface that draws a marker says so. */
  lat: number;
  lng: number;
  /* Audited every month — the only population where a store-level
     month-over-month comparison means anything. */
  core: boolean;
};

/* The field team. Auditors are assigned to city routes, which is how
   field work is organised and what makes a revisit routable: the
   person who covered a door last month is the one who can go back. */
export type Auditor = { id: string; name: string; cities: string[] };

export type PosmType = { id: string; name: string; channels: string[] | null };
export type OosReason = { id: string; name: string };

export type ScoreWeights = {
  availability: number;
  shelfShare: number;
  assortment: number;
  price: number;
  posm: number;
};

/* A follow-up audit already in flight when the portal opens: one
   cycle's gaps carried into the next as a request. Seeded in the
   generator rather than the app so every count the Action Center shows
   is derived from the same payload as the shelf. */
export type FollowUpSeed = {
  id: string;
  kpi: "availability" | "shelfShare" | "assortment" | "price" | "posm";
  brand: string;
  originMonth: string;
  cycle: string;
  createdAt: string;
  pos: string[];
};

export type Market = {
  contract: Contract;
  months: Month[];
  cities: City[];
  districts: District[];
  channels: Channel[];
  retailers: string[];
  brands: Brand[];
  skus: Sku[];
  auditors: Auditor[];
  followUps: FollowUpSeed[];
  posmTypes: PosmType[];
  oosReasons: OosReason[];
  shelfPositions: string[];
  scoreWeights: ScoreWeights;
  sharePar: number;
  requiredSkus: Record<string, number>;
  kpiTargets: Record<string, number>;
  pos: Pos[];
};

/* ---------- one month, hydrated ---------- */

export type CellState = "in-stock" | "out-of-stock";
export type ShelfPosition = "eye" | "upper" | "lower" | null;

export type Cell = {
  posId: string;
  skuId: string;
  state: CellState;
  facings: number;
  position: ShelfPosition;
};

export type Gap = {
  posId: string;
  skuId: string;
  /* Facings the outlet gives that SKU when it is stocked — the space
     standing empty, observed on the visit that found it. */
  normalFacings: number;
  reasonId: string;
};

export type PriceReading = {
  posId: string;
  skuId: string;
  price: number;
  rrp: number;
  /* Signed percent away from list. */
  variance: number;
  compliant: boolean;
};

export type PosmReading = { posId: string; typeId: string; present: boolean };

/* What a brand was DOING at an outlet, as opposed to what it held.
   Observed per brand, not per SKU: an auditor records that Coca-Cola
   is running something here, not that a particular can is. */
export type PromoReading = {
  posId: string;
  brandId: string;
  promo: boolean;
  display: boolean;
};

/* Per-outlet execution, computed in the generator so every surface
   reads the same number rather than each recomputing the composite.

   Three components are NULLABLE, and the null is load-bearing: an
   outlet that lists none of the client's range has no availability to
   report, and one where no price was recorded has no compliance. The
   composite reweights over whatever does apply. Anything averaging
   these must skip the nulls — treating "nothing to measure" as zero is
   how a store ends up reading "availability 0%, price 100%". */
export type PosScore = {
  posId: string;
  score: number;
  availability: number | null;
  shelfShare: number | null;
  assortment: number;
  price: number | null;
  posm: number | null;
};

export type MonthData = {
  month: string;
  audited: { posId: string; auditedAt: string; auditorId: string }[];
  cells: Cell[];
  gaps: Gap[];
  prices: PriceReading[];
  posm: PosmReading[];
  promos: PromoReading[];
  scores: PosScore[];
};

/* ---------- trends ---------- */

export type TrendPoint = {
  month: string;
  outlets: number;
  score: number;
  availability: number;
  shelfShare: number;
  assortment: number;
  price: number;
  posm: number;
  brandShare: Record<string, number>;
  /* Share of audited outlets where the brand was running a promotion,
     and where it held a secondary display — the activity behind a
     shelf movement, so a gain can be explained and not just reported. */
  promoShare: Record<string, number>;
  displayShare: Record<string, number>;
};

export type Trends = {
  months: { id: string; label: string; short: string; current: boolean }[];
  /* Every audited outlet — breadth, comparable at market level. */
  market: TrendPoint[];
  /* The same 400 doors every month — the only store-level line. */
  core: TrendPoint[];
  byCity: Record<string, TrendPoint[]>;
  byChannel: Record<string, TrendPoint[]>;
};
