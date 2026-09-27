/* A change, stated with its own significance and what it means.

   Under a rotating panel most small movements are sampling noise. A
   delta below the detection floor reads "flat", so nobody builds a plan
   on a 0.4pt swing the panel cannot resolve.

   Direction is the arrow and the sign; meaning is the colour. Given the
   measure's `better` direction (lib/market/outcome.ts), a change that is
   good news reads green and bad news red in the client portal (Violet
   700 / Ink on the Vemi surface), and a screen reader hears "better" or
   "worse". Without `better` the change is only stated, never judged. */

import { deltaOutcome, type Better } from "@/lib/market/outcome";

const TONE = { better: "text-delta-better", worse: "text-delta-worse", neutral: "text-text", flat: "" } as const;

export default function Delta({
  value,
  unit = "pt",
  floor = 0,
  better,
  label,
}: {
  value: number;
  unit?: string;
  floor?: number;
  /* Which direction is good news for this measure. */
  better?: Better;
  label?: string;
}) {
  const outcome = deltaOutcome(value, floor, better);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const shown = Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0);

  return (
    <span className="mono inline-flex items-baseline gap-1 text-xs font-medium text-text">
      {outcome === "flat" ? (
        <span className="text-text-muted">flat</span>
      ) : (
        <span className={`inline-flex items-baseline gap-1 ${TONE[outcome]}`}>
          <span aria-hidden>{value > 0 ? "▲" : "▼"}</span>
          {sign}
          {shown}
          {unit}
          {(outcome === "better" || outcome === "worse") && <span className="sr-only">, {outcome}</span>}
        </span>
      )}
      {label && <span className="font-normal text-text-muted">{label}</span>}
    </span>
  );
}
