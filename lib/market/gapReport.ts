/* ============================================================
   GAP REPORTS.

   The client's own team works the gaps; Vemi's job is to hand them
   over in a form a rep can be sent out with. One row per issue —
   per POS-SKU where the KPI is SKU-level — carrying the outlet, where
   it is, what is wrong, what the outlet scored, what the target is,
   and a reference back to the visit that saw it.

   The export follows the ACTIVE FILTERS. A report downloaded from a
   page narrowed to Pepsi 500ml in Baghdad contains Pepsi 500ml in
   Baghdad, or the file and the screen disagree and the file wins the
   argument in somebody's inbox a week later.
   ============================================================ */

import { brandName, contract, monthLabel } from "./index";
import { getTargets } from "./settings";
import type { MarketView } from "./filters";
import { KPI_LABEL, type Issue, type IssueKpi } from "./issues";
import { posKpi } from "./followUp";

const HEADER = [
  "POS ID",
  "POS name",
  "Governorate",
  "District",
  "Channel",
  "Retailer",
  "Visit date",
  "Brand",
  "SKU",
  "Issue",
  "Baseline KPI",
  "KPI target",
  "Severity",
  "Evidence reference",
];

const escape = (cell: string | number) => {
  const text = String(cell ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function gapReportCsv(
  issues: Issue[],
  kpi: IssueKpi,
  view: MarketView,
  full: MarketView
): string {
  const target = getTargets()[kpi];
  const rows = issues.map((issue) => [
    issue.posCode,
    issue.posName,
    issue.governorate,
    issue.district,
    issue.channel,
    issue.retailer,
    issue.auditedAt,
    brandName(issue.brandId),
    issue.skuId ?? "",
    issue.type,
    posKpi(view, full, issue.posId, kpi) ?? "",
    target,
    issue.severity,
    issue.evidenceRef,
  ]);

  const preamble = [
    [`${contract.client} — ${contract.brand} ${contract.country}`],
    [`${KPI_LABEL[kpi]} gaps · ${monthLabel(view.month)}`],
    [
      `${new Set(issues.map((i) => i.posId)).size} affected POS · ${issues.length} issues`,
      "",
      "Filtered exactly as the page was when this was downloaded.",
    ],
    [],
  ];

  return [...preamble, HEADER, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
}

export const gapFileName = (kpi: IssueKpi, month: string) =>
  `vemi-${kpi.toLowerCase()}-gaps-${month}`;
