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

/* Band fills (plan D1): a four-step ramp where darker means "needs you
   sooner" — Violet 100, Violet 400, Violet, Ink. Used for pins, heat
   cells and swatches; always beside the band word. */
export const BAND_COLOR: Record<Band, string> = {
  strong: "var(--vm-band-strong)",
  average: "var(--vm-band-average)",
  attention: "var(--vm-band-attention)",
  critical: "var(--vm-band-critical)",
};

/* The swatch needs an edge where its fill is lighter than the surface
   it sits on (Violet 100 on white), or the lightest band disappears. */
export const BAND_EDGE: Record<Band, string> = {
  strong: "var(--vm-band-average)",
  average: "transparent",
  attention: "transparent",
  critical: "transparent",
};

/* Swatches: the small colour keys that explain a chip — the status
   chip's cut-off panel, the notification list. They follow the chips,
   so inside the client portal they are the universal status colours
   (docs/PORTAL-NEUTRAL-PLAN.md) while pins and heat cells still read
   BAND_COLOR until the marks move over (that plan's phase 2). */
export const BAND_SWATCH: Record<Band, string> = {
  strong: "var(--vm-swatch-strong)",
  average: "var(--vm-swatch-average)",
  attention: "var(--vm-swatch-attention)",
  critical: "var(--vm-swatch-critical)",
};
export const BAND_SWATCH_EDGE: Record<Band, string> = {
  strong: "var(--vm-swatch-strong-edge)",
  average: "var(--vm-swatch-average-edge)",
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
