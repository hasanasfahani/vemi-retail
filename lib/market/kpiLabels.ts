/* ============================================================
   WHAT EACH MEASURE IS CALLED.

   One map, because there were five, and three of them disagreed.

   Observed before this file existed: the same measure was "Shelf &
   visibility" in the follow-up queue, "Share of shelf" on the Setup
   page, "Shelf share" on the dashboard tile and in the health cards.
   Price compliance was "Pricing" in one and "Price compliance" in
   three. Nobody had decided anything different — five places had each
   independently written down a reasonable name, and the reader met
   two of them side by side: the Watch control on a KPI tile said
   "Shelf & visibility" while the tile it sat on said "Shelf share".

   These names are the MEASURE, and they are what the reader sees
   wherever a number is named. They are deliberately not the same thing
   as a SECTION name: the Performance tab called "Shelf & visibility"
   covers both shelf share and eye-level conversion, so naming the tab
   after one of its two measures would be narrower than the tab is.
   A section may be broader than a measure; a measure is called one
   thing.
   ============================================================ */

export type KpiId =
  | "availability"
  | "shelfShare"
  | "assortment"
  | "price"
  | "posm";

export const KPI_NAME: Record<KpiId | "score", string> = {
  availability: "Availability",
  shelfShare: "Shelf share",
  assortment: "Assortment",
  price: "Price compliance",
  posm: "POSM",
  score: "Execution score",
};

/* One line saying what the measure counts. Used where a name alone is
   too terse to act on — the Setup page's target list, an export header
   — and kept beside the names so the two cannot drift apart either. */
export const KPI_HINT: Record<KpiId | "score", string> = {
  availability: "Listed lines found in stock",
  shelfShare: "Client facings as a share of the fixture",
  assortment: "Range carried against the format's expectation",
  price: "Readings within 5% of RRP",
  posm: "Agreed material present where checked",
  score: "The weighted composite of the five above",
};
