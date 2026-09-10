/* The five-group navigation the brief specifies. Groups are the
   reader's job, not the data's domain: Market Intelligence answers
   "what is happening", Execution answers "what do we do about it",
   and keeping those apart is what stops the portal reading as eleven
   equally-weighted report pages. */

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /* Announced but not built. The rail shows it with a padlock and no
     link, because a menu that hides what is coming teaches nobody
     anything, and one that links to an empty page teaches the wrong
     thing. */
  locked?: boolean;
};
export type NavGroup = {
  label: string;
  items: NavItem[];
  /* Groups the rail extends at runtime. The reports a person builds
     cannot be a constant, and the sidebar is the only place that knows
     about them — so the group is marked here rather than the sidebar
     matching on a label string that a rename would break. */
  id?: "reports";
};

export type IconName =
  | "dashboard" | "performance" | "competition" | "insights"
  | "actions" | "pos" | "report" | "trends"
  | "setup" | "users" | "customers" | "watchlist" | "custom-report" | "plus";

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/portal", label: "Executive Dashboard", icon: "dashboard" }],
  },
  {
    label: "Market Intelligence",
    items: [
      { href: "/portal/performance", label: "Performance", icon: "performance" },
      { href: "/portal/competition", label: "Competition", icon: "competition" },
      { href: "/portal/insights", label: "Insights", icon: "insights" },
      { href: "/portal/customers", label: "Customers", icon: "customers", locked: true },
    ],
  },
  {
    label: "Execution",
    items: [
      { href: "/portal/actions", label: "Follow-up Audits", icon: "actions" },
      { href: "/portal/pos", label: "POS Explorer", icon: "pos" },
      { href: "/portal/watchlist", label: "Watchlist", icon: "watchlist" },
    ],
  },
  {
    label: "Reports",
    id: "reports",
    items: [
      { href: "/portal/reports", label: "Monthly Reports", icon: "report" },
      { href: "/portal/trends", label: "Historical Trends", icon: "trends" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/portal/setup", label: "Audit Setup", icon: "setup" },
      { href: "/portal/users", label: "Users & Settings", icon: "users" },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);
/* Locked items are not destinations, so they never name a page. */
export const REACHABLE = ALL_ITEMS.filter((i) => !i.locked);
export const titleFor = (pathname: string) =>
  ALL_ITEMS.find((i) => i.href === pathname)?.label ?? "Vemi";
