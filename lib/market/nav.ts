/* The five-group navigation the brief specifies. Groups are the
   reader's job, not the data's domain: Market Intelligence answers
   "what is happening", Execution answers "what do we do about it",
   and keeping those apart is what stops the portal reading as eleven
   equally-weighted report pages. */

export type NavItem = { href: string; label: string; icon: IconName };
export type NavGroup = { label: string; items: NavItem[] };

export type IconName =
  | "dashboard" | "performance" | "competition" | "insights"
  | "actions" | "pos" | "report" | "trends"
  | "setup" | "users";

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
    ],
  },
  {
    label: "Execution",
    items: [
      { href: "/portal/actions", label: "Follow-up Audits", icon: "actions" },
      { href: "/portal/pos", label: "POS Explorer", icon: "pos" },
    ],
  },
  {
    label: "Reports",
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
export const titleFor = (pathname: string) =>
  ALL_ITEMS.find((i) => i.href === pathname)?.label ?? "Vemi";
