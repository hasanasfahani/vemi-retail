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
};

export type City = {
  id: string;
  name: string;
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

export type PosmType = { id: string; name: string; channels: string[] | null };
export type OosReason = { id: string; name: string };

export type ScoreWeights = {
  availability: number;
  shelfShare: number;
  assortment: number;
  price: number;
  posm: number;
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
   reads the same number rather than each recomputing the composite. */
export type PosScore = {
  posId: string;
  score: number;
  availability: number;
  shelfShare: number;
  assortment: number;
  price: number;
  posm: number;
};

export type MonthData = {
  month: string;
  audited: { posId: string; auditedAt: string }[];
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
