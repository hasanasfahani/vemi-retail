/* ============================================================
   TAKING A FINDING OUT OF THE PORTAL.

   Two ways out, and both hand the reader something they can check.

   The mail body is not a summary written about the finding — it is the
   finding's own headline, its own figure, its own scope and its own
   formula, in the order the card shows them. Somebody who receives it
   should be able to open the link, see the same screen, and find the
   same numbers.
   ============================================================ */

import type { DecisionInsight } from "./insightModel";
import { OUTCOME_LABEL } from "./insightModel";
import { monthLabel } from "./index";

/* mailto: hands the message to whatever the reader actually uses. The
   portal has no mail server, and a success toast for a message nobody
   sent would be the one screen in here that lies. */
export function mailtoFor(insight: DecisionInsight, month: string, url: string): string {
  const subject = `${insight.headline} — ${monthLabel(month)}`;

  const lines = [
    insight.headline,
    "",
    insight.impact.label,
    `${insight.scope.outlets.toLocaleString()} ${
      insight.scope.outlets === 1 ? "outlet" : "outlets"
    } · ${insight.scope.label} · ${monthLabel(month)}`,
    "",
    insight.detail,
    "",
    `How it was calculated: ${insight.evidence.formula}`,
    "",
    `Open it in Vemi: ${url}`,
    "",
    `${OUTCOME_LABEL[insight.outcome]} · ${insight.priorityBand} priority`,
  ];

  /* Some mail clients truncate a very long mailto. The formula is the
     first thing to go, because it is the one part the link itself will
     show in full. */
  const body = lines.join("\n");
  const trimmed = body.length > 1600 ? `${body.slice(0, 1580)}…` : body;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmed)}`;
}

/* The address of one finding, so the link in the mail lands on the
   drawer rather than on the page it was found on. */
export function insightUrl(insight: DecisionInsight, origin: string): string {
  return `${origin}/portal/insights?insight=${encodeURIComponent(insight.id)}`;
}
