/* ============================================================
   VEMI — SINGLE SOURCE OF TRUTH FOR ALL COPY
   Edit copy, pricing, stats, cities here — not in components.

   ⚠️ PLACEHOLDERS to swap before launch are grouped in `placeholders`
      and marked inline with `/* PLACEHOLDER *​/`.
   ============================================================ */

export const placeholders = {
  // Swap these once real values are confirmed.
  priceEssential: "$X,XXX", // PLACEHOLDER
  priceProfessional: "$X,XXX", // PLACEHOLDER
  phone: "+964 XXX XXX XXXX", // PLACEHOLDER
  whatsapp: "#", // PLACEHOLDER — WhatsApp Business link
  linkedin: "https://linkedin.com/company/vemi-iq",
  email: "sales@vemi.iq",
};

export const nav = {
  brand: "Vemi",
  links: [
    { label: "Platform", href: "#solution" },
    { label: "Coverage", href: "#coverage" },
    { label: "Packages", href: "#packages" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: { label: "Request a Demo", href: "#final-cta" },
};

export const hero = {
  eyebrow: "Trusted by FMCG teams across Iraq",
  headlineLines: ["See Every Shelf.", "Know Every Move.", "Win Every Decision."],
  subhead:
    "Vemi is Iraq's first real-time retail audit intelligence platform. Track your brand's availability, shelf share, pricing, and competitor activity across 1,000+ points of sale in 8 major cities — updated weekly.",
  trustRow: ["1,000+ Points of Sale", "8 Iraqi Cities", "Weekly Field Audits"],
  primaryCta: { label: "Request a Demo", href: "#final-cta" },
  secondaryCta: { label: "See the Dashboard", href: "#solution" },
};

export const problem = {
  label: "The Challenge",
  headline:
    "Every Day Without Shelf Intelligence Is a Day You're Losing Market Share",
  stats: [
    { value: "40%", label: "of purchase decisions happen at the shelf in Iraqi retail" },
    { value: "62%", label: "of FMCG brands don't know their real shelf availability" },
    { value: "3.2x", label: "revenue impact of in-stock vs. out-of-stock SKUs" },
    { value: "$2.1M", label: "avg. annual revenue lost to distribution blind spots" },
  ],
  painCards: [
    {
      title: "You think you're on the shelf. You're not.",
      body: "Distributor reports say everything's fine — 23% of your SKUs are invisible to shoppers right now.",
    },
    {
      title: "Your competitor moved. You didn't see it.",
      body: "Price drop in Mosul, new promo slot in Basra — you find out next quarter.",
    },
    {
      title: "Your planogram is a fantasy.",
      body: "National strategy vs. shelf reality: misplaced SKUs, stolen facings, shrinking share.",
    },
    {
      title: "You're deciding on last month's guesses.",
      body: "By the time data arrives, the market has already shifted.",
    },
  ],
  cta: { label: "Stop Guessing. Start Knowing.", href: "#final-cta" },
};

export const solution = {
  label: "The Platform",
  headline: "One Dashboard. Every Shelf. Zero Blind Spots.",
  subhead:
    "Vemi combines on-the-ground retail audits across hypermarkets, supermarkets, and traditional trade into one live intelligence platform. Updated weekly. Actionable immediately.",
  features: [
    {
      title: "Availability Tracking",
      short: "Know what's present, missing, or misplaced — by city, channel, store.",
      icon: "grid",
    },
    {
      title: "Shelf Share Analysis",
      short: "Your linear share vs. every competitor, tracked over time.",
      icon: "bars",
    },
    {
      title: "Price Intelligence",
      short: "Shelf, competitor, and promo price — with violation alerts.",
      icon: "tag",
    },
    {
      title: "Visibility Score",
      short: "Eye-level, end-cap, or back shelf — know your real visibility.",
      icon: "eye",
    },
    {
      title: "Promotion & POSM Tracker",
      short: "Every competitor promo and display, as soon as it hits the shelf.",
      icon: "photo",
    },
    {
      title: "Competitor Watch",
      short: "Side-by-side benchmarking: availability, share, price, promos.",
      icon: "swap",
    },
    {
      title: "Offer Intelligence",
      short: "Bundles, discounts, loyalty offers, flash promos — tracked.",
      icon: "gift",
    },
    {
      title: "Out-of-Stock Alerts",
      short: "Real-time OOS by SKU, city, channel — prioritize field action.",
      icon: "alert",
    },
  ],
  coverageStrip: "1,000+ POS · 8 Cities · 3 Channels · Weekly updates",
  cta: { label: "See It In Action", href: "#final-cta" },
};

export const socialProof = {
  label: "Trusted By",
  logoCount: 4,
  statLine:
    "Built by a team with 8+ years across FMCG, retail, and marketplace operations in the GCC.",
};

export const coverage = {
  label: "Our Coverage",
  headline: "1,000 Eyes on the Ground. 8 Cities. Complete Retail Visibility.",
  cities: [
    { name: "Baghdad", density: "dense", pos: 320, hyper: 45, super: 128, trad: 147, updated: "2 days ago", x: 50, y: 52 },
    { name: "Basra", density: "dense", pos: 180, hyper: 22, super: 70, trad: 88, updated: "3 days ago", x: 62, y: 82 },
    { name: "Mosul", density: "medium", pos: 120, hyper: 14, super: 46, trad: 60, updated: "4 days ago", x: 40, y: 22 },
    { name: "Erbil", density: "medium", pos: 110, hyper: 16, super: 44, trad: 50, updated: "3 days ago", x: 52, y: 20 },
    { name: "Najaf", density: "medium", pos: 90, hyper: 8, super: 34, trad: 48, updated: "5 days ago", x: 44, y: 62 },
    { name: "Karbala", density: "medium", pos: 80, hyper: 7, super: 30, trad: 43, updated: "5 days ago", x: 40, y: 56 },
    { name: "Sulaymaniyah", density: "medium", pos: 70, hyper: 6, super: 26, trad: 38, updated: "4 days ago", x: 66, y: 26 },
    { name: "Duhok", density: "light", pos: 40, hyper: 2, super: 12, trad: 26, updated: "6 days ago", x: 44, y: 10 },
  ],
  channels: [
    { channel: "Hypermarkets", pos: 120, pct: "12%", desc: "Large format, national chains, high traffic" },
    { channel: "Supermarkets", pos: 380, pct: "38%", desc: "Medium format, neighborhood focus" },
    { channel: "Traditional Trade", pos: 500, pct: "50%", desc: "Small groceries, bakkalas, specialty stores" },
  ],
  timeline: [
    { step: "Field Visit", when: "Days 1–20", body: "Trained auditors visit every POS with a structured digital checklist and geo-tagged photography." },
    { step: "Data Upload & QA", when: "Within 24h", body: "Photos, measurements, and observations uploaded with automated quality checks." },
    { step: "Analysis & Insight", when: "24–48h", body: "Raw data becomes trends, alerts, and benchmarks." },
    { step: "Dashboard Update", when: "Weekly", body: "Fresh data live every week. No waiting, no surprises." },
  ],
};

export const useCases = {
  label: "Use Cases",
  headline: "Built for the People Who Own the Shelf",
  cards: [
    { role: "Trade Marketing Manager", job: "Catch OOS and price violations before they cost a quarter of sales." },
    { role: "Category / Brand Manager", job: "Prove shelf share gains and defend budget with weekly, ground-truth data." },
    { role: "Sales Director", job: "Arm the field team with a prioritized action list, not a spreadsheet dump." },
  ],
  cta: { label: "Find Your Package", href: "#packages" },
};

export const packages = {
  label: "Packages",
  headline: "Intelligence Packages Built for Every FMCG Player",
  subhead:
    "Whether you manage one category or a full portfolio, there's a Vemi package for it.",
  tiers: [
    {
      name: "Vemi Essential",
      audience: "For emerging brands, single-category focus",
      price: placeholders.priceEssential,
      priceSuffix: "/month",
      priceNote: "Starting from",
      featured: false,
      features: [
        "1 category",
        "Availability tracking",
        "OOS alerts",
        "Basic shelf share",
        "Weekly updates",
        "Email alerts",
        "Standard support (24h)",
      ],
      limits: "3 core SKUs · 2 cities · 1 channel",
      bonus: null,
      cta: { label: "Get Started", href: "#final-cta" },
    },
    {
      name: "Vemi Professional",
      audience: "For established multi-SKU brands",
      price: placeholders.priceProfessional,
      priceSuffix: "/month",
      priceNote: "Starting from",
      featured: true,
      ribbon: "Most Popular",
      features: [
        "3 categories",
        "Full availability & shelf share",
        "Price intelligence + violation alerts",
        "Visibility score",
        "Promo/POSM monitoring",
        "Competitor benchmarking (3 competitors)",
        "Priority OOS routing",
        "Custom reports",
        "Priority support (8h)",
      ],
      limits: "8 SKUs/category · 5 cities · all 3 channels",
      bonus: "Monthly strategy call with a Vemi analyst",
      cta: { label: "Request a Demo", href: "#final-cta" },
    },
    {
      name: "Vemi Enterprise",
      audience: "For market leaders",
      price: "Custom",
      priceSuffix: "",
      priceNote: "",
      featured: false,
      features: [
        "Unlimited categories & SKUs",
        "All 8 modules",
        "Unlimited competitor tracking",
        "All 8 cities + expansion",
        "All channels",
        "Real-time alert config",
        "API/ERP access",
        "White-label exports",
        "Dedicated account manager",
        "Quarterly business reviews",
        "Custom insight development",
      ],
      limits: null,
      bonus: null,
      cta: { label: "Contact for Custom Quote", href: "#final-cta" },
    },
  ],
  footnote:
    "All packages include geo-tagged shelf photography, historical trend analysis, mobile dashboard access, and multi-user accounts.",
  enterpriseNote:
    "Need something specific? Every Enterprise package is tailored. Let's talk.",
};

export const faq = {
  label: "FAQ",
  headline: "Questions, Answered",
  items: [
    {
      q: "How is data collected?",
      a: "Trained field auditors visit each POS with a structured digital checklist and geo-tagged photography.",
    },
    {
      q: "How often is the dashboard updated?",
      a: "Weekly, with QA completed within 24 hours of each field visit.",
    },
    {
      q: "Can I track specific competitors?",
      a: "Yes — Professional tracks up to 3, Enterprise is unlimited.",
    },
    {
      q: "Do you cover traditional trade, or just modern retail?",
      a: "Both — hypermarkets, supermarkets, and traditional trade across all 8 cities.",
    },
    {
      q: "Can Vemi integrate with our ERP or BI tools?",
      a: "Yes, on Enterprise via API access.",
    },
    {
      q: "How fast can we start?",
      a: "Onboarding timeline to be confirmed — talk to sales for a tailored start plan.", // PLACEHOLDER answer
    },
  ],
};

export const finalCta = {
  headline: "The Shelf Doesn't Lie. Neither Does Vemi.",
  subhead:
    "Join the FMCG brands replacing guesswork with ground truth. Your market share depends on what happens at the shelf — make sure you see it.",
  primaryCta: { label: "Contact Sales", href: `mailto:${placeholders.email}` },
  secondaryLinks: [
    "Request a Pilot Audit",
    "Schedule a Demo Call",
    "Download Package Brochure",
  ],
  badges: [
    "Weekly field audits",
    "Geo-tagged photography",
    "Human-verified data",
    "4-hour response time",
  ],
  trust: "We respond to all inquiries within 4 business hours.",
};

export const footer = {
  brand: "Vemi",
  tagline: "Iraq's real-time retail intelligence platform.",
  navLinks: [
    { label: "Problem", href: "#problem" },
    { label: "Platform", href: "#solution" },
    { label: "Coverage", href: "#coverage" },
    { label: "Packages", href: "#packages" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#final-cta" },
  ],
  credibility: "Made for Iraq's FMCG market.",
};
