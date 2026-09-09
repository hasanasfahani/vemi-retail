/* The monthly report and the historical view.

   The report is a VIEW of the same modules the interactive pages use,
   so the test that matters is that it agrees with them — a report that
   quietly recomputes a KPI is a report that will one day contradict
   the dashboard in front of a client. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, loadMonth, contract } from "./index";
import { buildReport, headline, reportCsv, reportFileName } from "./report";
import { availability, posm, shelf } from "./performance";
import { scoreboard } from "./competition";
import { repeated } from "./trendsView";

const view = applyFilters(EMPTY_FILTERS, current);
const report = buildReport(view);

describe("the monthly report", () => {
  it("quotes the same figures the pages compute, not its own", () => {
    const a = availability(view);
    const s = shelf(view);
    const p = posm(view);
    expect(report.kpis.find((k) => k.id === "availability")!.value).toBe(a.rate);
    expect(report.kpis.find((k) => k.id === "share")!.value).toBe(s.clientShare);
    expect(report.kpis.find((k) => k.id === "posm")!.value).toBe(p.compliance);
    expect(report.score.value).toBe(view.kpi.score);
  });

  it("states coverage against the contract", () => {
    expect(report.coverage.contracted).toBe(contract.contractedPos);
    expect(report.coverage.audited).toBe(view.posCount);
    expect(report.coverage.audited + report.coverage.remaining).toBe(
      report.coverage.contracted
    );
  });

  it("carries a detection floor with every movement figure", () => {
    /* A change without its floor is a direction the panel may not be
       able to resolve. */
    for (const kpi of report.kpis) {
      expect(kpi.floor).toBeGreaterThan(0);
      expect(kpi.target).toBeGreaterThan(0);
    }
  });

  it("ranks opportunities by modelled value, largest first", () => {
    for (let i = 1; i < report.opportunities.length; i += 1) {
      expect(report.opportunities[i - 1].money ?? 0).toBeGreaterThanOrEqual(
        report.opportunities[i].money ?? 0
      );
    }
    expect(report.exposed).toBe(
      report.opportunities.reduce((s, i) => s + (i.money ?? 0), 0)
    );
  });

  it("only puts critical findings under risks", () => {
    for (const risk of report.risks) expect(risk.severity).toBe("critical");
    expect(report.risks.length).toBeGreaterThan(0);
    expect(report.risks.length).toBeLessThanOrEqual(5);
  });

  it("summarises every city that was audited", () => {
    const audited = new Set(view.outlets.map((o) => o.governorateId));
    expect(report.governorates.length).toBe(audited.size);
    for (const city of report.governorates) expect(city.outlets).toBeGreaterThan(0);
  });

  it("writes a headline anyone can check against the page", () => {
    expect(headline(report)).toContain(String(report.score.value));
    expect(headline(report)).toContain(report.coverage.audited.toLocaleString());
  });
});

describe("the CSV export", () => {
  const csv = reportCsv(report);
  const lines = csv.split("\n");

  it("carries every section of the report, not just one table", () => {
    for (const section of [
      "Coverage", "Market score", "KPIs", "Governorates",
      "Competitive summary", "Biggest risks", "Biggest opportunities",
      "Recommended actions",
    ]) {
      expect(csv).toContain(section);
    }
  });

  it("includes the modelling basis, so the money figures travel with it", () => {
    /* A dinar total in a spreadsheet with no assumption attached is
       the number most likely to be quoted back with certainty. */
    expect(csv).toContain("Basis");
    expect(csv).toContain("not measured");
  });

  it("escapes fields that would otherwise break the file", () => {
    const quoted = lines.filter((line) => line.includes('"'));
    expect(quoted.length).toBeGreaterThan(0);
    for (const line of quoted) {
      /* Every quote character comes in a pair. */
      expect((line.match(/"/g) ?? []).length % 2).toBe(0);
    }
  });

  it("names the file after the client and the cycle", () => {
    expect(reportFileName(report)).toContain(report.month);
  });

  it("matches the report's own competitive rows", () => {
    const board = scoreboard(view);
    for (const brand of board) expect(csv).toContain(brand.name);
  });
});

describe("repeated outlets", () => {
  it("only lists doors audited in both cycles", async () => {
    const previous = await loadMonth("2026-08");
    const priorView = applyFilters({ ...EMPTY_FILTERS, month: "2026-08" }, previous);
    const rows = repeated(priorView, view);

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(priorView.auditedAt.has(row.posId)).toBe(true);
      expect(view.auditedAt.has(row.posId)).toBe(true);
      expect(row.delta).toBe(row.after - row.before);
    }
    /* And it is a genuine sample of the panel, not everything. */
    expect(rows.length).toBeLessThan(view.posCount + priorView.posCount);
  });

  it("shows movement in both directions", async () => {
    /* A list where every outlet improved would mean the comparison is
       picking winners rather than reporting what happened. */
    const previous = await loadMonth("2026-08");
    const rows = repeated(
      applyFilters({ ...EMPTY_FILTERS, month: "2026-08" }, previous),
      view
    );
    expect(rows.some((r) => r.delta > 0)).toBe(true);
    expect(rows.some((r) => r.delta < 0)).toBe(true);
  });
});
