/* Status is a state, not a colour. One function decides it from a
   figure and its target, and every surface — pill, marker, table cell,
   score ring — reads that decision, so a POS that is "Needs attention"
   on the map cannot be green in the table.

   The four bands are the PRD's: Strong, Average, Needs Attention,
   Critical. Colour NEVER travels alone — every consumer of this pairs
   the swatch with the label. */

export type Band = "strong" | "average" | "attention" | "critical";

export const BAND_LABEL: Record<Band, string> = {
  strong: "Strong",
  average: "Average",
  attention: "Needs attention",
  critical: "Critical",
};

/* Token names, resolved to CSS variables at the point of use. */
export const BAND_COLOR: Record<Band, string> = {
  strong: "var(--color-good)",
  average: "var(--color-warn)",
  attention: "var(--color-serious)",
  critical: "var(--color-critical)",
};

export const BAND_CLASS: Record<Band, string> = {
  strong: "bg-[color:var(--color-good)]/10 text-[color:var(--color-good)]",
  average: "bg-[color:var(--color-warn)]/14 text-[#8a6100]",
  attention: "bg-[color:var(--color-serious)]/14 text-[#a24c22]",
  critical: "bg-[color:var(--color-critical)]/10 text-[color:var(--color-critical)]",
};

/* Score bands, from the execution score's own scale. */
export const SCORE_BANDS: { band: Band; min: number }[] = [
  { band: "strong", min: 85 },
  { band: "average", min: 70 },
  { band: "attention", min: 55 },
  { band: "critical", min: 0 },
];

export function scoreBand(score: number): Band {
  return SCORE_BANDS.find((b) => score >= b.min)!.band;
}

/* A rate against its target: at or above target is strong, and each
   step below widens by a tenth of the target. Relative rather than
   absolute, so the same function reads availability (target 95) and
   POSM compliance (target 70) without a table of special cases. */
export function rateBand(value: number, target: number): Band {
  if (value >= target) return "strong";
  const step = target * 0.1;
  if (value >= target - step) return "average";
  if (value >= target - step * 2) return "attention";
  return "critical";
}

/* Movement is judged against a detection floor, not against zero. A
   change smaller than the floor is noise from the rotating panel and
   must read as flat, whatever its sign. */
export function isMaterial(delta: number, floor: number): boolean {
  return Math.abs(delta) >= floor;
}
