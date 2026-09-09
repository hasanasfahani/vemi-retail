/* ============================================================
   THE MONTHLY REPORT.

   One assembled object: coverage, score, KPIs, risks, opportunities,
   the competitive summary and the recommended actions. Every part is
   pulled from the same modules the interactive pages use — the report
   is a VIEW of the month, not a second calculation of it, so a figure
   in the report and the same figure on the dashboard cannot drift.

   It also builds the CSV. "Export Excel" downloads the report's own
   numbers rather than a toast, because a client who asks for the
   figures should get the figures.
   ============================================================ */

import {
  clientBrand, cities, cityName, contract, monthLabel,
} from "./index";
import { getTargets } from "./settings";
import type { MarketView } from "./filters";
import { generateInsights, type Insight } from "./insights";
import { marketStories, type Story } from "./stories";
import { scoreboard, type BrandRow } from "./competition";
import { availability, movement, posm, shelf } from "./performance";
import { formatIqd, impactAssumption } from "./economics";
import { scoreBand, rateBand, type Band } from "@/components/market/ui/health";

export type ReportKpi = {
  id: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  delta: number;
  floor: number;
  band: Band;
};

export type Report = {
  month: string;
  monthLabel: string;
  coverage: {
    contracted: number;
    audited: number;
    pct: number;
    remaining: number;
    daysRemaining: number;
  };
  score: { value: number; band: Band; target: number };
  kpis: ReportKpi[];
  risks: Insight[];
  opportunities: Insight[];
  exposed: number;
  competitive: BrandRow[];
  stories: Story[];
  cities: { id: string; label: string; score: number; outlets: number; band: Band }[];
  recommended: Insight[];
};

export function buildReport(view: MarketView): Report {
  const insights = generateInsights(view);
  const a = availability(view);
  const s = shelf(view);
  const p = posm(view);
  const board = scoreboard(view);

  const kpi = (
    id: string,
    label: string,
    value: number,
    target: number,
    key: Parameters<typeof movement>[1],
    unit = "%"
  ): ReportKpi => {
    const move = movement(view, key);
    return {
      id, label, value, unit, target,
      delta: move.delta,
      floor: move.floor,
      band: rateBand(value, target),
    };
  };

  const scoreById = new Map(view.scores.map((row) => [row.posId, row]));

  /* Risks are the findings that threaten a number; opportunities are
     the ones with money attached. A finding can be both, and the
     report says so rather than picking one and hiding the other. */
  const risks = insights.all
    .filter((i) => i.severity === "critical")
    .slice(0, 5);
  const opportunities = insights.all
    .filter((i) => i.money !== null && i.money > 0)
    .sort((x, y) => (y.money ?? 0) - (x.money ?? 0))
    .slice(0, 5);

  return {
    month: view.month,
    monthLabel: monthLabel(view.month),
    coverage: {
      contracted: view.inScopeCount,
      audited: view.posCount,
      pct: view.coveragePct,
      remaining: view.notAuditedCount,
      daysRemaining: contract.daysRemaining,
    },
    score: {
      value: view.kpi.score,
      band: scoreBand(view.kpi.score),
      target: getTargets().score,
    },
    kpis: [
      kpi("availability", "On-shelf availability", a.rate, getTargets().availability, "availability"),
      kpi("share", "Share of shelf", s.clientShare, getTargets().shelfShare, "shelfShare"),
      kpi("assortment", "Assortment compliance", view.kpi.assortment, getTargets().assortment, "assortment"),
      kpi("price", "Price compliance", view.kpi.price, getTargets().price, "price"),
      kpi("posm", "POSM compliance", p.compliance, getTargets().posm, "posm"),
    ],
    risks,
    opportunities,
    exposed: opportunities.reduce((sum, i) => sum + (i.money ?? 0), 0),
    competitive: board,
    stories: marketStories(view),
    cities: cities
      .map((city) => {
        const outlets = view.outlets.filter((o) => o.cityId === city.id);
        const scores = outlets.flatMap((o) => {
          const row = scoreById.get(o.id);
          return row ? [row.score] : [];
        });
        const mean = scores.length
          ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)
          : 0;
        return {
          id: city.id,
          label: city.name,
          score: mean,
          outlets: outlets.length,
          band: scoreBand(mean),
        };
      })
      .filter((row) => row.outlets > 0)
      .sort((x, y) => y.score - x.score),
    recommended: insights.headlines,
  };
}

/* ---------- the CSV ----------

   Sectioned rather than one flat table, because the report is not one
   table: coverage, KPIs, cities, risks and opportunities are different
   shapes, and flattening them into shared columns would produce a file
   full of empty cells. */
export function reportCsv(report: Report): string {
  const rows: (string | number)[][] = [];
  const section = (title: string, header: (string | number)[]) => {
    rows.push([]);
    rows.push([title]);
    rows.push(header);
  };

  rows.push([`${contract.client} — ${contract.brand} ${contract.country}`]);
  rows.push([`${contract.category} retail execution, ${report.monthLabel}`]);

  section("Coverage", ["Contracted", "Audited", "Coverage %", "Remaining", "Days left"]);
  rows.push([
    report.coverage.contracted,
    report.coverage.audited,
    report.coverage.pct,
    report.coverage.remaining,
    report.coverage.daysRemaining,
  ]);

  section("Market score", ["Execution score", "Target"]);
  rows.push([report.score.value, report.score.target]);

  section("KPIs", ["KPI", "Value", "Unit", "Target", "Change vs last month", "Detection floor"]);
  for (const k of report.kpis) {
    rows.push([k.label, k.value, k.unit, k.target, k.delta, k.floor]);
  }

  section("Cities", ["City", "Execution score", "Outlets audited"]);
  for (const c of report.cities) rows.push([c.label, c.score, c.outlets]);

  section("Competitive summary", [
    "Brand", "Share of shelf %", "Availability %", "Facings per outlet",
    "Price index", "Promotion presence %", "Eye-level share %",
  ]);
  for (const b of report.competitive) {
    rows.push([b.name, b.share, b.availability, b.perOutlet, b.priceIndex, b.promo, b.visibility]);
  }

  section("Biggest risks", ["Finding", "Severity", "Outlets", "Concentrated in", "Impact"]);
  for (const risk of report.risks) {
    rows.push([
      risk.headline,
      risk.severity,
      risk.scope.outlets,
      risk.concentration ? cityName(risk.concentration.cityId) : "market-wide",
      risk.impact.label,
    ]);
  }

  section("Biggest opportunities", ["Finding", "Outlets", "Concentrated in", "Modelled value (IQD)"]);
  for (const item of report.opportunities) {
    rows.push([
      item.headline,
      item.scope.outlets,
      item.concentration ? cityName(item.concentration.cityId) : "market-wide",
      item.money ?? "",
    ]);
  }

  section("Recommended actions", ["Finding", "Category", "Outlets", "Next step"]);
  for (const item of report.recommended) {
    rows.push([item.headline, item.category, item.scope.outlets, item.cta.label]);
  }

  rows.push([]);
  rows.push(["Basis"]);
  rows.push([impactAssumption ?? "Impact stated in facing-days; no shelf price available."]);
  rows.push([
    `Movement is reported against a bootstrapped detection floor. Figures below the floor for their slice are shown as flat rather than given a direction.`,
  ]);

  const escape = (cell: string | number) => {
    const text = String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export const reportFileName = (report: Report) =>
  `vemi-${contract.brand.toLowerCase()}-${report.month}-report`;

export const headline = (report: Report) =>
  `${clientBrand.name} scored ${report.score.value}/100 across ${report.coverage.audited.toLocaleString()} audited outlets, with ${formatIqd(report.exposed)} IQD of modelled value in the top five opportunities.`;
