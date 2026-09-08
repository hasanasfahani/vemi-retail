/* ============================================================
   VEMI PORTAL — shell model
   Navigation, scope, and national coverage state.

   Language rule: everything in here is customer-facing copy inside
   a live platform. Erbil is "active"; the rest of Iraq is "available
   on subscription" — never "unbuilt", never "sample".
   ============================================================ */

import { meta, pos } from "./portalData";

/* Scope reads from the audit payload, so the badge, the page headers
   and the numbers can never disagree. */
const currentWindow = meta.windows.find((w) => w.id === meta.currentWindow)!;
const previousWindow = meta.windows.find((w) => w.id === meta.previousWindow)!;

export const scope = {
  country: "Iraq",
  city: meta.city,
  category: meta.category,
  /* "As of" is now a window, not a day. The short form is for places
     that were already tight on space; the long form states the trailing
     period, which is what the figure actually describes. */
  dataAsOf: currentWindow.shortLabel,
  windowLabel: currentWindow.label,
  windowStart: currentWindow.start,
  windowEnd: currentWindow.end,
  windowDays: meta.windowDays,
  previousVisit: previousWindow.shortLabel,
  previousWindowLabel: previousWindow.label,
  /* Audited in the current window vs the universe. Two different
     numbers, and the gap between them is the coverage story. */
  posCount: currentWindow.outletsAudited,
  posUniverse: meta.posUniverse,
  previousPosCount: previousWindow.outletsAudited,
  skuCount: meta.skuCount,
  /* Outlets audited in every window — the paired population every
     movement claim is drawn from. */
  corePanelSize: meta.corePanelSize,
};

/* Categories the platform runs. Only the subscribed one carries data;
   the rest are the next thing to buy, not hidden features. */
export type CategoryOption = { id: string; label: string; active: boolean };

export const categories: CategoryOption[] = [
  { id: "csd", label: "Carbonated Beverages", active: true },
  { id: "water", label: "Water & Juices", active: false },
  { id: "dairy", label: "Dairy & Chilled", active: false },
  { id: "frozen", label: "Frozen Food", active: false },
  { id: "snacks", label: "Snacks & Confectionery", active: false },
  { id: "home", label: "Home & Personal Care", active: false },
];

export type NavItem = {
  href: string;
  label: string;
  locked?: boolean;
};

/* One flat list.

   The sidebar used to split into Executive and Operate, which made a
   real persona difference visible in the furniture. That split earned
   its keep while three pages sat under Executive — Command Center,
   Digest and Reports, which between them rendered substantially the
   same content three times. With Digest and Reports gone and Command
   Center thinned to Overview, "Executive" would be a heading over a
   single item: a group label that groups nothing, and one more thing
   to read on the way to the page you wanted. */
export type NavGroup = { label: string; items: NavItem[] };

export const portalNav: NavItem[] = [
  { href: "/dashboard/overview", label: "Overview" },
  { href: "/dashboard/priorities", label: "Priorities" },
  { href: "/dashboard/watchlist", label: "Watchlist" },
  { href: "/dashboard/shelf", label: "Shelf" },
  { href: "/dashboard/oos-alerts", label: "Out-of-Stock Alerts" },
  { href: "/dashboard/pricing", label: "Price Intelligence" },
  { href: "/dashboard/competitors", label: "Competitor Watch" },
  { href: "/dashboard/visibility", label: "Visibility & POSM", locked: true },
];

export const portalNavGroups: NavGroup[] = [
  { label: "", items: portalNav },
];

/* ------------------------------------------------------------------
   National coverage.

   Positions are true lat/long run through the same projection the
   marketing map uses, so a governorate sits where it really is:
     x = 9.591 * lon - 368.85
     y = 432.83 - 11.497 * lat
------------------------------------------------------------------ */
export type Governorate = {
  name: string;
  seat: string;
  x: number;
  y: number;
  active: boolean;
  /* Outlets Vemi can field on request — the size of the prize, and the
     reason the pin is worth unlocking. */
  potentialPos: number;
  /* Market context, so a locked governorate still tells a sales
     director something worth knowing. Population figures are published
     governorate estimates, rounded; the retail note describes how the
     carbonated category actually trades there. */
  population: number;
  retail: string;
};

export const governorates: Governorate[] = [
  { name: "Erbil", seat: "Erbil", x: 53.25, y: 16.74, active: true, potentialPos: 100 , population: 1.9, retail: "KRG's commercial centre — modern trade unusually strong, malls and organised supermarkets take a large share of volume." },
  { name: "Duhok", seat: "Duhok", x: 43.34, y: 8.96, active: false, potentialPos: 60 , population: 1.3, retail: "Border trade with Türkiye; Turkish imports compete hard on price in traditional grocery." },
  { name: "Nineveh", seat: "Mosul", x: 44.71, y: 15.02, active: false, potentialPos: 140 , population: 4.0, retail: "Mosul rebuilding fast — traditional trade dominant, distribution still consolidating after reconstruction." },
  { name: "Sulaymaniyah", seat: "Sulaymaniyah", x: 66.93, y: 23.99, active: false, potentialPos: 110 , population: 2.2, retail: "Second KRG market; strong local retail chains and a developed cooler culture." },
  { name: "Halabja", seat: "Halabja", x: 72.2, y: 28.39, active: false, potentialPos: 20 , population: 0.11, retail: "Small border governorate, almost entirely traditional grocery." },
  { name: "Kirkuk", seat: "Kirkuk", x: 56.92, y: 25.06, active: false, potentialPos: 70 , population: 1.7, retail: "Mixed market straddling federal and KRG supply routes — two distribution systems in one city." },
  { name: "Salah al-Din", seat: "Tikrit", x: 50.07, y: 35.05, active: false, potentialPos: 55 , population: 1.7, retail: "Dispersed towns along the Tigris; route-to-market cost per outlet is high." },
  { name: "Diyala", seat: "Baqubah", x: 59.33, y: 44.96, active: false, potentialPos: 50 , population: 1.7, retail: "Agricultural belt feeding Baghdad; wholesale-led rather than retail-led." },
  { name: "Anbar", seat: "Ramadi", x: 46.51, y: 48.64, active: false, potentialPos: 45 , population: 1.9, retail: "Long highway corridor to Jordan and Syria — roadside and forecourt trade matters more than city retail." },
  { name: "Baghdad", seat: "Baghdad", x: 56.63, y: 49.83, active: false, potentialPos: 300 , population: 8.9, retail: "The prize: roughly a quarter of Iraq's population and the deepest modern-trade base in the country." },
  { name: "Babil", seat: "Hillah", x: 57.27, y: 59.36, active: false, potentialPos: 60 , population: 2.2, retail: "Dense town network south of Baghdad, heavy traditional grocery presence." },
  { name: "Karbala", seat: "Karbala", x: 53.39, y: 57.84, active: false, potentialPos: 55 , population: 1.4, retail: "Pilgrimage economy — demand spikes hard around Arbaeen and Ashura." },
  { name: "Wasit", seat: "Kut", x: 70.59, y: 59.04, active: false, potentialPos: 40 , population: 1.5, retail: "Iranian border trade; competing imported carbonates are a real factor on shelf." },
  { name: "Najaf", seat: "Najaf", x: 56.19, y: 64.97, active: false, potentialPos: 65 , population: 1.6, retail: "Second pilgrimage centre; hospitality and on-trade demand outsize the resident population." },
  { name: "Qadisiyyah", seat: "Diwaniyah", x: 62.03, y: 65.05, active: false, potentialPos: 40 , population: 1.4, retail: "Diwaniyah-centred, mid-size traditional market." },
  { name: "Maysan", seat: "Amarah", x: 83.32, y: 66.81, active: false, potentialPos: 35 , population: 1.2, retail: "Southern marshland governorate; long distribution routes, few organised outlets." },
  { name: "Muthanna", seat: "Samawah", x: 65.45, y: 72.6, active: false, potentialPos: 30 , population: 0.9, retail: "Iraq's least dense governorate — outlet universe is small and widely spread." },
  { name: "Dhi Qar", seat: "Nasiriyah", x: 74.8, y: 75.92, active: false, potentialPos: 55 , population: 2.4, retail: "Nasiriyah is a large southern hub with a young population skewing to single-serve packs." },
  { name: "Basra", seat: "Basra", x: 89.46, y: 82.07, active: false, potentialPos: 150 , population: 3.0, retail: "Port city and oil economy — highest disposable income in the south, strong chilled demand year-round." },
];

export const coverage = {
  activeCount: governorates.filter((g) => g.active).length,
  totalCount: governorates.length,
  lockedPotentialPos: governorates
    .filter((g) => !g.active)
    .reduce((sum, g) => sum + g.potentialPos, 0),
};

/* Districts and their outlet counts come straight off the audited
   outlet list, so the map panel can't drift from the data. */
export type ErbilArea = { name: string; pos: number };

export const erbilAreas: ErbilArea[] = Object.entries(
  pos.reduce<Record<string, number>>((acc, p) => {
    acc[p.area] = (acc[p.area] ?? 0) + 1;
    return acc;
  }, {})
)
  .map(([name, count]) => ({ name, pos: count }))
  .sort((a, b) => b.pos - a.pos || a.name.localeCompare(b.name));

export const UNLOCK_MESSAGE = "Unlock full Iraq coverage with a subscription.";

/* ------------------------------------------------------------------
   Erbil districts, positioned for the city view.

   These are approximate district centroids, not surveyed boundaries —
   enough to put each neighbourhood in its true bearing and rough
   distance from the Citadel, which is what makes a city view readable.
   The suburbs (Baharka north-west, Kasnazan east, Daratu south-east)
   really do sit well outside the ring roads.
------------------------------------------------------------------ */
export type DistrictPoint = { name: string; lat: number; lng: number };

export const ERBIL_CITADEL = { lat: 36.1911, lng: 44.0092 };

export const districtPoints: DistrictPoint[] = [
  { name: "Ankawa", lat: 36.234, lng: 43.985 },
  { name: "Baharka", lat: 36.2725, lng: 43.9215 },
  { name: "Bakhtiari", lat: 36.205, lng: 44.023 },
  { name: "Brayati", lat: 36.213, lng: 44.01 },
  { name: "Daratu", lat: 36.157, lng: 44.072 },
  { name: "Downtown / Qaysari", lat: 36.1911, lng: 44.0092 },
  { name: "Dream City", lat: 36.176, lng: 43.945 },
  { name: "Gulan", lat: 36.19, lng: 43.96 },
  { name: "Havalan", lat: 36.18, lng: 43.995 },
  { name: "Iskan", lat: 36.203, lng: 43.982 },
  { name: "Kasnazan", lat: 36.223, lng: 44.098 },
  { name: "Kurdistan", lat: 36.199, lng: 43.994 },
  { name: "Minara", lat: 36.191, lng: 43.981 },
  { name: "Naz City", lat: 36.171, lng: 43.977 },
  { name: "Runaki", lat: 36.196, lng: 44.03 },
  { name: "Setaqan", lat: 36.188, lng: 44.002 },
  { name: "Shorsh", lat: 36.183, lng: 44.017 },
  { name: "Zanko", lat: 36.207, lng: 43.96 },
];
