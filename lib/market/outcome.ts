/* WHETHER A CHANGE IS GOOD NEWS.

   The client portal colours a change by what it means, not by which way
   it points (docs/PORTAL-NEUTRAL-PLAN.md, phase 3): availability up is
   good news, out-of-stock gaps up is bad news, and both are ▲. So every
   measure states which direction is better, in one table, and one
   function turns a change into an outcome. The arrow still shows the
   direction and the figure is always written; colour is the third cue,
   never the only one.

   A change inside the detection floor is "flat" whatever its sign: under
   a rotating panel it is sampling noise, and colouring it would invite a
   plan built on it. */

import type { KpiId } from "./kpiLabels";

export type Better = "up" | "down";
export type Outcome = "better" | "worse" | "flat" | "neutral";

/* Which way is good news, per measure. Rates and the score climb toward
   their targets; counts of failures fall. A measure missing here is not
   judged (neutral), rather than guessed. */
export const BETTER: Record<KpiId | "score" | "gapsFound", Better> = {
  availability: "up",
  shelfShare: "up",
  assortment: "up",
  price: "up",
  posm: "up",
  score: "up",
  gapsFound: "down",
};

export function deltaOutcome(value: number, floor: number, better?: Better): Outcome {
  if (Math.abs(value) < floor || value === 0) return "flat";
  if (!better) return "neutral";
  const up = value > 0;
  return up === (better === "up") ? "better" : "worse";
}
