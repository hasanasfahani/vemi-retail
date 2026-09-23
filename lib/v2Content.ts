/* ============================================================
   VEMI /v2 — SINGLE SOURCE OF TRUTH FOR ALL COPY

   Lead-generation structure: every section must create urgency,
   demonstrate value, build trust, or drive conversion. Sections that
   only described Vemi (platform tour, process diagram, coverage essay,
   role list) were removed.

   Coverage and performance figures are maintained in one place so
   they can be verified and updated without changing section markup.
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

export type Photo = {
  src: string;
  alt: string;
  caption: string;
  position?: string;
};

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

/* ---------- §1 Navigation ---------------------------------- */
export const nav = {
  brand: "Vemi",
  links: [
    { label: "Retail Intelligence", href: `#${ids.retail}` },
    { label: "Insight to Action", href: `#${ids.action}` },
    { label: "Trust", href: `#${ids.trust}` },
    { label: "Market Intelligence", href: `#${ids.market}` },
    { label: "Pricing", href: `#${ids.request}` },
  ],
  cta: { label: "Explore Dashboard", href: "/portal/performance" },
};

/* ---------- §1 Hero ----------------------------------------- */
export const hero = {
  headlineLines: ["See Every Shelf.", "Understand Your Market.", "Act Faster and Smarter."],
  subhead:
    "Turn verified shelf evidence into faster decisions across availability, execution, pricing, and competition.",
  primaryCta: { label: "Explore Dashboard", href: "/portal/performance" },
  secondaryCta: { label: "Get a quote", href: `#${ids.request}` },
  image: {
    src: "/images/v2/vemi-performance-dashboard.png",
    alt: "Vemi performance dashboard showing shelf availability, audit coverage, and channel comparisons",
    caption: "Vemi performance dashboard",
  } satisfies Photo,
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
    gapLabel: "Shelf verification gap",
    gapBody: "The red segment shows reported distribution that Vemi could not verify on shelf.",
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
  image: Photo;
};

export const insightToAction = {
  eyebrow: "From insight to action",
  headline: "A signal is only worth what you do with it.",
  subhead:
    "Every finding arrives with the next step attached — and Vemi measures whether the fix worked.",
  cases: [
    {
      signal: "Availability drops across key outlets",
      tone: "critical",
      detail: "Vemi detects an out-of-stock concentration across outlets in a single week.",
      steps: [
        "Identify the affected stores, down to SKU",
        "Prioritize distributor and sales action by lost volume",
        "Request a follow-up audit on the same outlets",
      ],
      outcome: { label: "Availability recovered", from: "71%", to: "84%", note: "two weeks later" },
      image: {
        src: "/images/v2/insight-iraq-availability-gap.jpg",
        alt: "Refrigerated packaged-food shelf with an isolated empty facing in an Iraqi hypermarket",
        caption: "Availability gap",
        position: "50% 50%",
      },
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
      image: {
        src: "/images/v2/insight-iraq-competitive-shelf.jpg",
        alt: "Wide Iraqi supermarket aisle with competing packaged-food brands across both shelves",
        caption: "Packaged food",
        position: "50% 50%",
      },
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
      image: {
        src: "/images/v2/insight-iraq-beverages.jpg",
        alt: "Multiple soft-drink brands displayed across an Iraqi supermarket aisle",
        caption: "Beverages",
        position: "50% 50%",
      },
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
    outlet: "Dur Nassrawey Center",
    location: "Erbil · Downtown / Qaysari",
    channel: "Mini-market",
    captured: "12 Aug 2026 · 15:10",
    auditRef: "#22137918",
    status: "Human-verified",
    finding: "Multiple competing brand blocks detected across the same freezer bay",
    analysisPoints: ["Brand blocks identified", "Shelf levels mapped", "Facing patterns extracted"],
    placeholder: true,
    image: {
      src: "/audit/a_22137918_prg_1725137_q_2556239_i_24.jpg",
      alt: "Timestamped retail audit photograph showing multiple frozen-food brands in one display bay",
      caption: "Competitive set · source photograph",
      position: "50% 43%",
    } satisfies Photo,
  },
};

/* ---------- §7 Market Intelligence → One Market View --------- */
export type Pillar = {
  key: string;
  title: string;
  tagline: string;
  icon: string;
  body: string;
  items: string[];
  image: Photo;
};

export const beyond = {
  eyebrow: "Market intelligence",
  headline: "Understand the market from every angle.",
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
      image: {
        src: "/audit/a_22137918_prg_1725137_q_2556239_i_27.jpg",
        alt: "Multiple competing brands visible together on a retail freezer shelf",
        caption: "Competitive activity · at the shelf",
        position: "50% 42%",
      },
    },
    {
      key: "consumer",
      title: "Consumer & Shopper Insights",
      tagline: "Understand why the shopper chose them instead.",
      icon: "people",
      body: "Structured research run through the same field network that already stands in the aisle.",
      items: ["Surveys", "Purchase drivers", "Brand perception", "Satisfaction", "Loyalty", "Switching behavior", "Shopper preferences", "Unmet needs"],
      image: {
        src: "/images/v2/consumer-shopper.jpg",
        alt: "Middle Eastern shopper considering products while pushing a supermarket trolley",
        caption: "Shopper behavior · in context",
        position: "50% 45%",
      },
    },
    {
      key: "market",
      title: "Market & Demand Intelligence",
      tagline: "See where the category is going, not just where it has been.",
      icon: "trend",
      body: "The wider signals that decide whether your category grows next quarter.",
      items: ["Category trends", "Demand signals", "Seasonality", "Geographic dynamics", "Macroeconomic signals", "Regulatory developments", "Market opportunities"],
      image: {
        src: "/images/v2/market-demand.jpg",
        alt: "Local vendor serving customers in a busy Middle Eastern market",
        caption: "Market activity · demand signals",
        position: "50% 44%",
      },
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

/* ---------- §8 Pricing quotation + contact form ------------- */
export const finalCta = {
  eyebrow: "Pricing quotation",
  headline: "Build a quote around your coverage.",
  subhead:
    "Adjust the scope below and we'll prepare a quotation tailored to your retail audit program.",
};

export const quoteScope = {
  posPerMonth: {
    label: "POS per month",
    min: 100,
    max: 5000,
    step: 100,
    initial: 1000,
    minLabel: "100 POS",
    maxLabel: "5,000+ POS",
  },
  categories: {
    label: "Categories",
    min: 1,
    max: 4,
    step: 1,
    initial: 1,
    minLabel: "1 category",
    maxLabel: "Up to 4",
  },
  cities: {
    label: "Cities",
    min: 1,
    max: 18,
    step: 1,
    initial: 12,
    minLabel: "1 city",
    maxLabel: "Up to 18",
  },
};

export const leadForm = {
  eyebrow: "Contact information",
  headline: "Where should we send your quote?",
  intro: "Share your business contact details and our team will confirm the scope with you.",
  subhead: "Your final quotation is confirmed after a short scope review with our team.",
  industries: [
    "FMCG",
    "Dairy",
    "Electronics",
    "Pharmacy & Health",
    "Distributor / Importer",
    "Agency / Research",
    "Other",
  ],
  submitLabel: "Get a Quote",
  success: {
    title: "Quotation request received.",
    body: "Thank you — our team will review your scope and contact you within one business day.",
  },
};

/* ---------- Footer ------------------------------------------ */
export const footer = {
  brand: "Vemi",
  tagline: "Verified retail and market intelligence for brands operating in Iraq.",
  eyebrow: "From shelf evidence to market action",
  headline: "See the market clearly. Move before it changes.",
  body: "Explore the live workspace or define your coverage to receive a tailored retail-audit quotation.",
  primaryCta: { label: "Explore Dashboard", href: "/portal/performance" },
  secondaryCta: { label: "View Pricing", href: `#${ids.request}` },
  columns: [
    {
      title: "Platform",
      links: [
        { label: "Retail Intelligence", href: `#${ids.retail}` },
        { label: "Insight to Action", href: `#${ids.action}` },
        { label: "Market Intelligence", href: `#${ids.market}` },
        { label: "Pricing", href: `#${ids.request}` },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Intelligence You Can Trust", href: `#${ids.trust}` },
        { label: "Proof", href: `#${ids.proof}` },
        { label: "Get a Quote", href: `#${ids.request}` },
      ],
    },
  ],
  credibility: "Built in Iraq, for Iraq's market.",
};
