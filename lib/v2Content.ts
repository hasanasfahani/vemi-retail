/* ============================================================
   VEMI /v2 — SINGLE SOURCE OF TRUTH FOR ALL COPY

   Lead-generation structure: every section must create urgency,
   demonstrate value, build trust, or drive conversion. Sections that
   only described Vemi (platform tour, process diagram, coverage essay,
   role list) were removed.

   ⚠️ FIGURES: everything in `figures` and any value marked
   `placeholder: true` is ILLUSTRATIVE. It renders with a visible
   marker and a footnote. Replace with verified data before launch.
   ============================================================ */

/* Anchor ids — the nav and every section agree through these. */
export const ids = {
  top: "top",
  gap: "gap",
  retail: "retail-intelligence",
  dashboard: "dashboard",
  action: "action",
  trust: "trust",
  market: "market-intelligence",
  proof: "proof",
  request: "request",
} as const;

/* ---------- figures (ALL ILLUSTRATIVE) ---------------------- */
export type Figure = { value: string; label: string; placeholder?: boolean };

/* `placeholder` is stated on every figure, not just the unverified ones,
   so "is this number real?" is always answered explicitly. */
export const figures = {
  pos: { value: "1,000+", label: "POS audited", placeholder: true },
  governorates: { value: "16", label: "Governorates", placeholder: true },
  cadence: { value: "Weekly", label: "Field intelligence", placeholder: false },
  channels: { value: "Modern + traditional", label: "Trade coverage", placeholder: false },
  evidence: { value: "Geo-tagged", label: "Evidence on every visit", placeholder: false },
  observations: { value: "41,280", label: "Observations logged", placeholder: true },
} satisfies Record<string, Figure>;

export const placeholderNote =
  "Illustrative figures — to be replaced with verified data before launch.";

/* ---------- §1 Navigation ---------------------------------- */
export const nav = {
  brand: "Vemi",
  links: [
    { label: "Retail Intelligence", href: `#${ids.retail}` },
    { label: "What You'll See", href: `#${ids.dashboard}` },
    { label: "Insight to Action", href: `#${ids.action}` },
    { label: "Trust", href: `#${ids.trust}` },
    { label: "Beyond the Shelf", href: `#${ids.market}` },
  ],
  cta: { label: "Request a Demo", href: `#${ids.request}` },
};

/* ---------- §1 Hero (with inline proof metrics) ------------- */
export const hero = {
  eyebrow: "Market intelligence for Iraq",
  headlineLines: ["See Every Shelf.", "Understand Your Market.", "Act Faster."],
  subhead:
    "Vemi gives brands verified visibility into retail execution, competitors, consumers, and market signals — starting with real-world retail intelligence.",
  primaryCta: { label: "Request a Demo", href: `#${ids.request}` },
  secondaryCta: { label: "See what you'll get", href: `#${ids.dashboard}` },
  /* short set — the fuller strip lives in §8 */
  metrics: [figures.pos, figures.governorates, figures.cadence],
};

/* ---------- §2 The Visibility Gap --------------------------- */
export const gap = {
  eyebrow: "The visibility gap",
  headline:
    "Your reports tell you what shipped. Vemi shows you what is actually happening.",
  subhead:
    "Shipment and distribution reports end at the warehouse door. What happens on the shelf — the part that decides whether a shopper can buy you — goes unmeasured.",
  items: [
    { title: "Out of stock", body: "Listed, shipped, and still unavailable to the shopper." },
    { title: "Missing facings", body: "Shelf space quietly conceded to a competitor." },
    { title: "Price violations", body: "Shelf price drifting off your recommended price." },
    { title: "Competitor moves", body: "New launches and promotions you learn about too late." },
  ],
  widget: {
    eyebrow: "Reported vs. actual",
    reportedLabel: "Reported distribution",
    reportedValue: 96,
    actualLabel: "Verified on shelf",
    actualValue: 73,
    gapLabel: "unverified",
    gapBody: "Distribution your reports count that Vemi could not find on the shelf.",
    tag: "Live audit · Baghdad",
    placeholder: true,
  },
};

/* ---------- §3 Retail Intelligence -------------------------- */
export type Capability = { title: string; short: string; icon: string };

export const retailAudit = {
  eyebrow: "Retail intelligence — what we measure",
  headline: "Know exactly what is happening at the point of sale.",
  subhead:
    "Trained auditors visit every outlet on a fixed weekly cycle and capture the shelf as it really is — measured, photographed, and verified.",
  capabilities: [
    { title: "Availability & OOS", short: "What is on shelf, what is missing, and where the gaps cost you most.", icon: "alert" },
    { title: "Shelf Share & Facings", short: "Your linear share and facing count against every competitor.", icon: "bars" },
    { title: "Pricing", short: "Shelf price, promo price, and drift from your recommended price.", icon: "tag" },
    { title: "Visibility", short: "Eye-level, end-cap, or bottom shelf — your real visibility.", icon: "eye" },
    { title: "Planogram Compliance", short: "Whether the agreed layout is the layout actually executed.", icon: "planogram" },
    { title: "Promotions & POSM", short: "Every promotion and display material, yours and theirs.", icon: "photo" },
    { title: "Assortment", short: "Which of your range is listed, stocked, and reaching shoppers.", icon: "assortment" },
    { title: "Competitor Tracking", short: "Side-by-side benchmarking on availability, share, price, and promos.", icon: "swap" },
  ] satisfies Capability[],
};

/* ---------- §4 See What's Happening. Know Where to Act. ----- */
export const decisions = {
  eyebrow: "What you'll see",
  headline: "See What's Happening. Know Where to Act.",
  subhead:
    "Every view answers a question you already ask in your Monday meeting — down to the outlet and the SKU.",
  cta: { label: "Explore the dashboard", href: `#${ids.request}` },
  /* each question is a panel in the dashboard */
  questions: [
    {
      q: "Where are we losing availability?",
      a: "Find out-of-stocks and distribution gaps down to POS and SKU.",
    },
    {
      q: "Where are competitors gaining shelf space?",
      a: "Compare shelf share, facings, visibility and assortment.",
    },
    {
      q: "Where is execution below target?",
      a: "Identify pricing, planogram, promotion and visibility gaps.",
    },
    {
      q: "What needs action first?",
      a: "Prioritize the locations and issues with the greatest commercial impact.",
    },
  ],
};

/* ---------- §5 From Insight to Action ----------------------- */
export type ActionCase = {
  signal: string;
  tone: "critical" | "warn";
  detail: string;
  steps: string[];
  outcome: { label: string; from: string; to: string; note: string };
};

export const insightToAction = {
  eyebrow: "From insight to action",
  headline: "A signal is only worth what you do with it.",
  subhead:
    "Every finding arrives with the next step attached — and Vemi measures whether the fix worked.",
  cases: [
    {
      signal: "Availability drops in Baghdad",
      tone: "critical",
      detail: "Vemi detects an out-of-stock concentration across outlets in a single week.",
      steps: [
        "Identify the affected stores, down to SKU",
        "Prioritize distributor and sales action by lost volume",
        "Request a follow-up audit on the same outlets",
      ],
      outcome: { label: "Availability recovered", from: "71%", to: "84%", note: "two weeks later" },
    },
    {
      signal: "A competitor gains shelf space",
      tone: "warn",
      detail: "Competitor facings rise in supermarkets while yours hold flat.",
      steps: [
        "See exactly where the change happened",
        "Compare your execution in the same outlets",
        "Investigate the assortment and visibility gaps behind it",
      ],
      outcome: { label: "Shelf share defended", from: "24%", to: "28%", note: "over one quarter" },
    },
    {
      signal: "A promotion isn't being executed",
      tone: "warn",
      detail: "Campaign POSM is missing from target stores mid-flight.",
      steps: [
        "Identify every non-compliant outlet",
        "Send the gap list to field teams",
        "Verify execution on the next visit",
      ],
      outcome: { label: "Promo compliance", from: "61%", to: "92%", note: "next audit cycle" },
    },
  ] satisfies ActionCase[],
  placeholder: true,
};

/* ---------- §6 Intelligence You Can Trust ------------------- */
export const trust = {
  eyebrow: "Intelligence you can trust",
  headline: "Every insight starts with evidence.",
  subhead:
    "Trained auditors visit every outlet on a fixed weekly cycle with a structured digital checklist. Every number on your dashboard traces back to a photograph, a place, and a time.",
  supportingLine: "AI-powered. Human-verified. Evidence-backed.",
  items: [
    { title: "Geo-tagged field evidence", body: "Know where and when observations were collected.", icon: "pin" },
    { title: "Source photography", body: "See the shelf behind the metric.", icon: "photo" },
    { title: "Quality assurance", body: "Validate completeness and collection quality.", icon: "workflow" },
    { title: "AI-assisted analysis", body: "Process large volumes of retail data efficiently.", icon: "spark" },
    { title: "Human verification", body: "Review critical and low-confidence findings.", icon: "check" },
    { title: "Traceable results", body: "Move from a dashboard metric back to the underlying evidence.", icon: "link" },
  ],
  evidence: {
    outlet: "Al-Mansour Market",
    location: "Baghdad · Al-Mansour",
    channel: "Supermarket",
    captured: "12 Sep 2026 · 10:42",
    auditor: "Field auditor #114",
    confidence: 96,
    status: "Human-verified",
    finding: "Cola 1L PET — out of stock",
    placeholder: true,
  },
};

/* ---------- §7 Beyond the Shelf → One Market View ----------- */
export type Pillar = {
  key: string;
  title: string;
  tagline: string;
  icon: string;
  body: string;
  items: string[];
};

export const beyond = {
  eyebrow: "Beyond the shelf",
  headline: "See beyond the shelf.",
  subhead:
    "Retail execution is where Vemi starts. The same field network and verification layer extend into the questions that sit behind your numbers.",
  pillars: [
    {
      key: "competitive",
      title: "Competitive Intelligence",
      tagline: "Know what they did before it shows up in your sales.",
      icon: "swap",
      body: "Closely connected to retail audit — the same store visits that measure your shelf also measure theirs.",
      items: ["Product launches", "Pricing & promotions", "Distribution", "Assortment", "Competitor activity", "Market benchmarking"],
    },
    {
      key: "consumer",
      title: "Consumer & Shopper Insights",
      tagline: "Understand why the shopper chose them instead.",
      icon: "people",
      body: "Structured research run through the same field network that already stands in the aisle.",
      items: ["Surveys", "Purchase drivers", "Brand perception", "Satisfaction", "Loyalty", "Switching behavior", "Shopper preferences", "Unmet needs"],
    },
    {
      key: "market",
      title: "Market & Demand Intelligence",
      tagline: "See where the category is going, not just where it has been.",
      icon: "trend",
      body: "The wider signals that decide whether your category grows next quarter.",
      items: ["Category trends", "Demand signals", "Seasonality", "Geographic dynamics", "Macroeconomic signals", "Regulatory developments", "Market opportunities"],
    },
  ] satisfies Pillar[],
  /* the convergence — closing beat of this section, not its own section */
  convergence: {
    title: "One market view",
    body: "Research that usually arrives from four different vendors, in four different formats, months apart — connected into a single intelligence view.",
    inputs: ["Retail execution", "Competitors", "Consumers", "Market signals"],
    output: "Better decisions",
  },
};

/* ---------- §8 Proof, Not Promises -------------------------- */
export const proof = {
  eyebrow: "Proof, not promises",
  headline: "Market intelligence built on real-world coverage.",
  strip: [
    figures.pos,
    figures.governorates,
    figures.cadence,
    figures.channels,
    figures.evidence,
  ],
};

/* ---------- §9 Final CTA + lead form ------------------------ */
export const finalCta = {
  headline: "What do you need to understand about your market?",
  subhead:
    "Tell us your category, your brands, and the question you need answered — we'll show you what Vemi already sees.",
  primary: { label: "Request a Demo", interest: "Demo" },
  secondary: { label: "Discuss Your Market", interest: "Market Discussion" },
};

export const leadForm = {
  eyebrow: "Request a demo",
  headline: "Tell us what you need to understand.",
  subhead: "We reply to every request within one business day.",
  industries: [
    "FMCG — Food",
    "FMCG — Beverages",
    "FMCG — Home & Personal Care",
    "Dairy",
    "Tobacco",
    "Pharmacy & Health",
    "Distributor / Importer",
    "Agency / Research",
    "Other",
  ],
  submitLabel: "Request Demo",
  success: {
    title: "Request received.",
    body: "Thank you — our team will contact you within one business day to set up your session.",
  },
};

/* ---------- Footer ------------------------------------------ */
export const footer = {
  brand: "Vemi",
  tagline: "Verified retail and market intelligence for brands operating in Iraq.",
  columns: [
    {
      title: "Platform",
      links: [
        { label: "Retail Intelligence", href: `#${ids.retail}` },
        { label: "What You'll See", href: `#${ids.dashboard}` },
        { label: "Insight to Action", href: `#${ids.action}` },
        { label: "Beyond the Shelf", href: `#${ids.market}` },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Intelligence You Can Trust", href: `#${ids.trust}` },
        { label: "Proof", href: `#${ids.proof}` },
        { label: "Request a Demo", href: `#${ids.request}` },
      ],
    },
  ],
  credibility: "Built in Iraq, for Iraq's market.",
};
