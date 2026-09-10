import { describe, expect, it } from "vitest";
import { current } from "./index";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { generateInsights } from "./insights";
import { decide } from "./insightModel";
import { insightUrl, mailtoFor } from "./insightShare";

const view = applyFilters(EMPTY_FILTERS, current);
const report = decide(generateInsights(view).all, view);
const insight = report.cards[0];

describe("sharing a finding", () => {
  it("sends the finding's own numbers, not a description of them", () => {
    const mail = decodeURIComponent(mailtoFor(insight, view.month, "http://x/y"));
    expect(mail).toContain(insight.headline);
    expect(mail).toContain(insight.impact.label);
    expect(mail).toContain(insight.evidence.formula);
  });

  it("links back to the finding, not to the page it was found on", () => {
    const url = insightUrl(insight, "https://vemi.example");
    expect(url).toBe(`https://vemi.example/portal/insights?insight=${insight.id}`);
    expect(decodeURIComponent(mailtoFor(insight, view.month, url))).toContain(url);
  });

  it("keeps the mailto short enough for a mail client to accept", () => {
    /* Long-tailed rules — R14's six-brand evidence, R11's formula — are
       the ones that would blow the limit, so every card is checked. */
    for (const card of report.cards) {
      expect(mailtoFor(card, view.month, "https://vemi.example/portal/insights?insight=x").length)
        .toBeLessThan(4000);
    }
  });

  it("escapes the subject, so a headline with an ampersand survives", () => {
    const mail = mailtoFor(
      { ...insight, headline: "Coca-Cola & 7UP hold 40%" },
      view.month,
      "http://x"
    );
    expect(mail).toContain("Coca-Cola%20%26%207UP");
  });
});
