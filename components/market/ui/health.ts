/* Status is a state, not a colour. One function decides it from a
   figure and its target, and every surface — pill, marker, table cell,
   score ring — reads that decision, so a POS that is "Needs attention"
   on the map cannot be green in the table.

   The four bands are the PRD's: Strong, Average, Needs Attention,
   Critical. Colour NEVER travels alone — every consumer of this pairs
   the swatch with the label. */

export type { Band } from "@/components/vemi/BandChip";
import type { Band } from "@/components/vemi/BandChip";

export const BAND_LABEL: Record<Band, string> = {
  strong: "Strong",
  average: "Average",
  attention: "Needs attention",
  critical: "Critical",
};

/* Band marks: pins, clusters, heat cells, gap bars, the swatches that
   explain a chip. Each is a role token (brand/tokens.css), so the Vemi
   surface draws the D1 violet ramp and the client portal
   (data-surface="portal") the universal status colours, from the same
   call. Always beside the band word. */
export const BAND_COLOR: Record<Band, string> = {
  strong: "var(--vm-mark-strong)",
  average: "var(--vm-mark-average)",
  attention: "var(--vm-mark-attention)",
  critical: "var(--vm-mark-critical)",
};

/* The inset edge a fill needs where it is too light for its ground:
   Violet 100 on the Vemi surface, yellow in the portal. */
export const BAND_EDGE: Record<Band, string> = {
  strong: "var(--vm-mark-strong-edge)",
  average: "var(--vm-mark-average-edge)",
  attention: "transparent",
  critical: "transparent",
};

/* A pin's outline against the map tiles: the surface, except where the
   fill is the light step and needs its edge instead. */
export const BAND_RING: Record<Band, string> = {
  strong: "var(--vm-mark-strong-ring)",
  average: "var(--vm-mark-average-ring)",
  attention: "var(--vm-surface)",
  critical: "var(--vm-surface)",
};

/* Text set on a mark (a cluster's count), ≥4.5:1 on each fill. */
export const BAND_ON: Record<Band, string> = {
  strong: "var(--vm-mark-strong-on)",
  average: "var(--vm-mark-average-on)",
  attention: "var(--vm-mark-attention-on)",
  critical: "var(--vm-mark-critical-on)",
};

/* The outer ring on a cluster whose members include critical outlets
   under a lighter band, so they are never averaged out of sight. */
export const MARK_ALARM = "var(--vm-mark-alarm)";

/* A value-against-target bar: Violet on the Vemi surface, the band's
   colour in the portal (yellow keeps its edge). */
export const BAND_GAUGE: Record<Band, string> = {
  strong: "var(--vm-gauge-strong)",
  average: "var(--vm-gauge-average)",
  attention: "var(--vm-gauge-attention)",
  critical: "var(--vm-gauge-critical)",
};
export const GAUGE_EDGE: Record<Band, string> = {
  strong: "transparent",
  average: "var(--vm-gauge-average-edge)",
  attention: "transparent",
  critical: "transparent",
};

/* The chip classes (components/vemi BandChip). */
export const BAND_CLASS: Record<Band, string> = {
  strong: "vm-band vm-band--strong",
  average: "vm-band vm-band--average",
  attention: "vm-band vm-band--attention",
  critical: "vm-band vm-band--critical",
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
