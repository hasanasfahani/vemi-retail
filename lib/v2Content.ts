/* ============================================================
   VEMI /v2 — SINGLE SOURCE OF TRUTH FOR ALL COPY

   The alternative positioning: Vemi as a market intelligence
   company whose flagship service is retail audit. Retail Audit
   (§5–9) carries ~75% of the page weight; the expansion pillars
   (§10–13) stay compact at ~25%.

   Edit copy here, never inside components.
   ============================================================ */

/* Anchor ids — the nav and every section agree through these. */
export const ids = {
  top: "top",
  problem: "problem",
  retail: "retail-intelligence",
  platform: "platform",
  howItWorks: "how-it-works",
  trust: "trust",
  coverage: "coverage",
  market: "market-intelligence",
  whyVemi: "why-vemi",
  who: "who",
  request: "request",
} as const;

/* ---------- §1 Navigation ---------------------------------- */
export const nav = {
  brand: "Vemi",
  links: [
    { label: "Retail Intelligence", href: `#${ids.retail}` },
    { label: "Market Intelligence", href: `#${ids.market}` },
    { label: "How It Works", href: `#${ids.howItWorks}` },
    { label: "Coverage", href: `#${ids.coverage}` },
    { label: "Why Vemi", href: `#${ids.whyVemi}` },
  ],
  cta: { label: "Request a Demo", href: `#${ids.request}` },
};

/* ---------- §2 Hero ---------------------------------------- */
export const hero = {
  eyebrow: "Market intelligence for Iraq",
  headlineLines: ["See Every Shelf.", "Understand Your Market.", "Act Faster."],
  subhead:
    "Vemi gives brands verified visibility into retail execution, competitors, consumers, and market signals — starting with real-world retail intelligence.",
  primaryCta: { label: "Request a Demo", href: `#${ids.request}` },
  secondaryCta: { label: "See how it works", href: `#${ids.howItWorks}` },
};

/* ---------- §3 Proof Bar ------------------------------------ */
export const proofBar = [
  { value: "1,000+", label: "Points of sale" },
  { value: "Nationwide", label: "Iraq coverage" },
  { value: "Weekly", label: "Field audits" },
  { value: "Geo-tagged", label: "Evidence" },
  { value: "Human", label: "Verified data" },
];

/* ---------- §4 The Problem ---------------------------------- */
export const problem = {
  eyebrow: "The gap",
  headline:
    "Your reports tell you what shipped. Vemi shows you what is actually happening.",
  subhead:
    "Shipment and distribution reports end at the warehouse door. What happens on the shelf — the part that decides whether a shopper can buy you — goes unmeasured.",
  gaps: [
    { title: "Out of stock", body: "Listed, shipped, and still unavailable to the shopper." },
    { title: "Missing SKUs", body: "Part of the range never reaches the shelf at all." },
    { title: "Lost facings", body: "Shelf space quietly conceded to a competitor." },
    { title: "Pricing issues", body: "Shelf price drifting off your recommended price." },
    { title: "Competitor moves", body: "New launches and promotions you learn about too late." },
  ],
  /* the reported-vs-actual widget */
  widget: {
    eyebrow: "Reported vs. actual",
    reportedLabel: "Reported distribution",
    reportedValue: 96,
    actualLabel: "Verified on shelf",
    actualValue: 73,
    gapLabel: "unverified",
    gapBody:
      "Distribution your reports count that Vemi could not find on the shelf.",
    tag: "Live audit · Baghdad",
  },
};

/* ---------- §5 Retail Audit (main service) ------------------ */
export type Capability = {
  title: string;
  short: string;
  icon: string;
};

export const retailAudit = {
  eyebrow: "Retail audit — main service",
  headline: "Know exactly what is happening at the point of sale.",
  subhead:
    "Trained auditors visit every outlet on a fixed cycle and capture the shelf as it really is — measured, photographed, and verified.",
  capabilities: [
    { title: "Availability & OOS", short: "What is on shelf, what is missing, and where the gaps cost you most.", icon: "alert" },
    { title: "Shelf Share & Facings", short: "Your linear share and facing count against every competitor.", icon: "bars" },
    { title: "Pricing", short: "Shelf price, promo price, and drift from your recommended price.", icon: "tag" },
    { title: "Visibility & Shelf Position", short: "Eye-level, end-cap, or bottom shelf — your real visibility.", icon: "eye" },
    { title: "Planogram Compliance", short: "Whether the agreed layout is the layout actually executed.", icon: "planogram" },
    { title: "Promotions & POSM", short: "Every promotion and display material, yours and theirs.", icon: "photo" },
    { title: "Assortment", short: "Which of your range is listed, stocked, and reaching shoppers.", icon: "assortment" },
    { title: "Competitor Tracking", short: "Side-by-side benchmarking on availability, share, price, and promos.", icon: "swap" },
  ] satisfies Capability[],
};

/* ---------- §6 Dashboard / product visual ------------------- */
export const platform = {
  eyebrow: "The platform",
  headline: "From thousands of store observations to one clear market view.",
  subhead:
    "Every visit rolls up into a single view you can cut by geography, channel, outlet, and SKU — so the question you ask is the answer you get.",
  filterChain: ["Governorate", "City", "Channel", "POS", "SKU"],
};

/* ---------- §7 How Vemi works ------------------------------- */
export const howItWorks = {
  eyebrow: "How Vemi works",
  headline: "Define. Collect. Analyze. Validate. Act.",
  subhead:
    "A repeatable cycle, run every week — so the picture is never out of date.",
  steps: [
    { step: "Define", icon: "target", body: "We agree the categories, SKUs, outlets, and questions that matter to your business." },
    { step: "Collect", icon: "mobile", body: "Field auditors capture the shelf in-store with a structured digital checklist and geo-tagged photography." },
    { step: "Analyze", icon: "cpu", body: "Computer vision and analytics turn raw observations into availability, share, price, and position." },
    { step: "Validate", icon: "shield", body: "Human reviewers verify every flagged result against the evidence before it reaches you." },
    { step: "Act", icon: "bolt", body: "Findings arrive as a prioritized action list, routed to the people who can fix them." },
  ],
};

/* ---------- §8 Trust & validation --------------------------- */
export const trust = {
  eyebrow: "Trust & validation",
  headline: "Intelligence you can verify.",
  subhead:
    "Every number on your dashboard traces back to a photograph, a place, and a time.",
  supportingLine: "AI-powered. Human-verified. Evidence-backed.",
  items: [
    { title: "Geo-tagged evidence", body: "Every observation is pinned to the outlet it came from.", icon: "pin" },
    { title: "Timestamped visits", body: "You always know exactly when the shelf was seen.", icon: "clock" },
    { title: "AI confidence", body: "Each automated reading carries a confidence score.", icon: "spark" },
    { title: "Human verification", body: "Low-confidence and flagged results go to a reviewer.", icon: "check" },
    { title: "QA workflows", body: "Structured checks before any result is published.", icon: "workflow" },
    { title: "Traceable results", body: "Drill from a national number down to the source photo.", icon: "link" },
  ],
  /* the evidence card */
  evidence: {
    outlet: "Al-Mansour Market",
    location: "Baghdad · Al-Mansour",
    channel: "Supermarket",
    captured: "12 Sep 2026 · 10:42",
    auditor: "Field auditor #114",
    confidence: 96,
    status: "Human-verified",
    finding: "Cola 1L PET — out of stock",
  },
};

/* ---------- §9 Coverage & scale ----------------------------- */
export const coverage = {
  eyebrow: "Coverage & scale",
  headline: "Nationwide intelligence, built to scale.",
  subhead:
    "Vemi runs across Iraq today, on an architecture designed to extend to the next market without rebuilding.",
  points: [
    { title: "All Iraqi governorates", body: "North to south, not just the capital." },
    { title: "Modern & traditional trade", body: "Hypermarkets, supermarkets, and the bakkala shelf." },
    { title: "Vemi collectors + local partners", body: "Our own field force, extended by vetted local teams." },
    { title: "Multi-country-ready architecture", body: "Built once to expand across the region." },
  ],
  /* governorate capitals pinned on the map */
  cities: [
    { name: "Baghdad", capital: true },
    { name: "Basra" },
    { name: "Mosul" },
    { name: "Erbil" },
    { name: "Najaf" },
    { name: "Karbala" },
    { name: "Sulaymaniyah" },
    { name: "Duhok" },
    { name: "Kirkuk" },
    { name: "Ramadi" },
    { name: "Hillah" },
    { name: "Nasiriyah" },
    { name: "Amarah" },
    { name: "Diwaniyah" },
    { name: "Kut" },
    { name: "Samarra" },
  ],
};

/* ---------- §10–13 Beyond retail audit ---------------------- */
export type Pillar = {
  key: string;
  title: string;
  tagline: string;
  icon: string;
  body: string;
  items: string[];
};

export const beyond = {
  eyebrow: "Beyond retail audit",
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
      items: [
        "Product launches",
        "Pricing & promotions",
        "Distribution",
        "Assortment",
        "Competitor activity",
        "Market benchmarking",
      ],
    },
    {
      key: "consumer",
      title: "Consumer & Shopper Insights",
      tagline: "Understand why the shopper chose them instead.",
      icon: "people",
      body: "Structured research run through the same field network that already stands in the aisle.",
      items: [
        "Surveys",
        "Purchase drivers",
        "Brand perception",
        "Satisfaction",
        "Loyalty",
        "Switching behavior",
        "Shopper preferences",
        "Unmet needs",
      ],
    },
    {
      key: "market",
      title: "Market & Demand Intelligence",
      tagline: "See where the category is going, not just where it has been.",
      icon: "trend",
      body: "The wider signals that decide whether your category grows next quarter.",
      items: [
        "Category trends",
        "Demand signals",
        "Seasonality",
        "Geographic dynamics",
        "Macroeconomic signals",
        "Regulatory developments",
        "Market opportunities",
      ],
    },
  ] satisfies Pillar[],
};

/* ---------- §14 Why Vemi / outcomes ------------------------- */
export const outcomes = {
  eyebrow: "Why Vemi",
  headline: "See gaps earlier. Act faster. Grow with better evidence.",
  subhead:
    "Capabilities only matter if they change what your team does on Monday.",
  items: [
    { title: "Improve availability", body: "Catch out-of-stocks while the week can still be saved." },
    { title: "Protect shelf share", body: "See facings slipping before the quarter closes." },
    { title: "Detect competitor moves", body: "Learn about a price drop in days, not next quarter." },
    { title: "Improve execution", body: "Hold distributors and field teams to the agreed plan." },
    { title: "Prioritize sales actions", body: "Send the team to the outlets where it pays most." },
    { title: "Understand market opportunities", body: "Find the cities and channels worth expanding into." },
  ],
};

/* ---------- §15 Who uses Vemi ------------------------------- */
export const whoUses = {
  eyebrow: "Who uses Vemi",
  headline: "Built for the people who own the shelf.",
  roles: [
    "Trade Marketing",
    "Sales",
    "Brand & Category",
    "Commercial Leadership",
    "Market Research & Insights",
  ],
};

/* ---------- §16 Final CTA ----------------------------------- */
export const finalCta = {
  headline: "See what is really happening in your market.",
  subhead:
    "Tell us your category, brands, markets, and the business questions you need answered.",
  primary: { label: "Request a Demo", interest: "Demo" },
  secondary: { label: "Request a Retail Audit", interest: "Retail Audit" },
};

/* ---------- §17 Lead form ----------------------------------- */
export const leadForm = {
  eyebrow: "Request a demo",
  headline: "Tell us what you need to understand.",
  subhead:
    "We reply to every request within one business day.",
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
  interests: ["Demo", "Retail Audit"],
  submitLabel: "Request Demo",
  success: {
    title: "Request received.",
    body: "Thank you — our team will contact you within one business day to set up your session.",
  },
};

/* ---------- Footer ------------------------------------------ */
export const footer = {
  brand: "Vemi",
  tagline:
    "Verified retail and market intelligence for brands operating in Iraq.",
  columns: [
    {
      title: "Platform",
      links: [
        { label: "Retail Intelligence", href: `#${ids.retail}` },
        { label: "Market Intelligence", href: `#${ids.market}` },
        { label: "How It Works", href: `#${ids.howItWorks}` },
        { label: "Coverage", href: `#${ids.coverage}` },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Why Vemi", href: `#${ids.whyVemi}` },
        { label: "Who Uses Vemi", href: `#${ids.who}` },
        { label: "Request a Demo", href: `#${ids.request}` },
      ],
    },
  ],
  credibility: "Built in Iraq, for Iraq's market.",
};
