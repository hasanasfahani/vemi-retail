/* Turning a finding — or a rolled-up decision — into the draft the
   Action Sheet opens with.

   The ten action controls in the product reduce to seven shapes, and
   what differs between them is only the line-item list and the noun
   used for it. Everything else is the sheet's common spine.

   The "no list" case is as important as the others: a fixture
   negotiation is genuinely one conversation, and giving it a checklist
   of one item would be ceremony. Those drafts carry an empty `items`
   and the sheet renders without a scope band. */

import { posOf } from "./portalData";
import type { Insight, RuleId } from "./insights";
import type { Decision } from "./decisions";
import type { ActionItem } from "./actionsShared";
import type { SheetDraft } from "@/components/portal/ActionSheet";

/* Which rules produce work that is a list of stops, and what those
   stops are called in that context. A rule absent here makes a single
   piece of work, not a route. */
const ITEM_NOUN: Partial<Record<RuleId, string>> = {
  "r1-persistent-gap": "outlets",
  "r9-dark-outlet": "outlets",
  "r10-new-gap-cluster": "outlets",
  "r5-price-cluster": "retailers",
  "r11-assortment-gap": "outlets",
  "r2-district-deficit": "districts",
  "r12-geographic-concentration": "districts",
  "r6-channel-gap": "channels",
  "r4-rival-substitution": "outlets",
  "r3-distribution-gap": "SKUs",
};

function itemFor(insight: Insight): ActionItem {
  const outlet = insight.entities.posId ? posOf(insight.entities.posId) : null;
  return {
    id: insight.id,
    label: outlet?.code ?? insight.entities.area ?? insight.scope.label,
    where: outlet?.area ?? insight.impact.label,
    done: false,
  };
}

/* A decision — several findings already rolled up by the move they
   imply. Its line items are the findings, de-duplicated by outlet so
   one store that trips two rules is one stop, not two. */
export function draftFromDecision(decision: Decision): SheetDraft {
  const seen = new Map<string, Insight>();
  for (const f of decision.findings) {
    const key = f.entities.posId ?? f.entities.area ?? f.id;
    const held = seen.get(key);
    if (!held || f.impact.value > held.impact.value) seen.set(key, f);
  }
  const findings = [...seen.values()].sort(
    (a, b) => b.impact.value - a.impact.value
  );

  return {
    title: decision.headline,
    rule: decision.findings[0]?.rule ?? decision.id,
    where: decision.findings[0]?.scope.label ?? "Erbil",
    notes: decision.detail,
    items: findings.map(itemFor),
    itemNoun: ITEM_NOUN[decision.findings[0]?.rule as RuleId] ?? "items",
    context: `${decision.impact.label} · ${decision.findings.length} finding${
      decision.findings.length === 1 ? "" : "s"
    } rolled up`,
  };
}

/* A chart's worth of findings on an operator page. Same shape, but the
   title comes from the top finding rather than a decision headline. */
export function draftFromFindings(
  findings: Insight[],
  label: string
): SheetDraft {
  const top = findings[0];
  const listable = ITEM_NOUN[top.rule];

  return {
    title: findings.length > 1 ? label : top.headline,
    rule: top.rule,
    where: top.scope.label,
    notes: top.detail,
    insightId: findings.length === 1 ? top.id : undefined,
    /* Only build a checklist where the work genuinely has stops. A
       single fixture negotiation gets none. */
    items: listable && findings.length > 1 ? findings.map(itemFor) : [],
    itemNoun: listable ?? "items",
    context: findings.length > 1 ? `${findings.length} findings in view` : top.impact.label,
  };
}

/* One insight card. Always a single piece of work. */
export function draftFromInsight(insight: Insight): SheetDraft {
  return {
    title: insight.headline,
    rule: insight.rule,
    where: insight.scope.label,
    notes: insight.detail,
    insightId: insight.id,
    items: [],
    itemNoun: "items",
    context: `${insight.impact.label} at ${insight.scope.label}`,
  };
}

/* The route. R12's own evidence table already names the districts in
   the cluster and their distance from the Citadel, so the visit order
   comes from the finding rather than being recomputed — worst first,
   which is also the order a rep would want to work them. */
export function routeDraft(concentration: Insight): SheetDraft {
  const rows = concentration.evidence.table.rows;
  return {
    title: `Route a rep through ${concentration.scope.label}`,
    rule: concentration.rule,
    where: concentration.scope.label,
    notes: concentration.detail,
    insightId: concentration.id,
    items: rows.map((row, index) => ({
      id: `district-${String(row[0]).toLowerCase().replace(/\s+/g, "-")}`,
      label: String(row[0]),
      where: `stop ${index + 1} · ${row[1]} outlets · ${row[3]}km from the Citadel`,
      done: false,
    })),
    itemNoun: "districts, worst first",
    context: `${concentration.impact.label} — one run covers all of them`,
  };
}
