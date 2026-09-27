import type { ReactNode } from "react";
import { cx } from "./cx";
import Icon, { type IconName } from "./Icon";

export type Band = "strong" | "average" | "attention" | "critical";

/** A band, or `neutral` for a state that is not a judgement: pending,
    no material change, out of scope, low priority. */
export type Tone = Band | "neutral";

export const BAND_WORD: Record<Band, string> = {
  strong: "Strong",
  average: "Average",
  attention: "Needs attention",
  critical: "Critical",
};

/* One shape per tone, so the state reads without colour: where red and
   green merge (1 in 12 men), check / minus / triangle / octagon still
   differ. */
const GLYPH: Record<Tone, IconName> = {
  strong: "check",
  average: "minus-circle",
  attention: "alert-triangle",
  critical: "alert-octagon",
  neutral: "circle",
};

/**
 * A health band. On the Vemi surface the fill style carries it (plan D1,
 * darker = needs you sooner); inside the client portal it takes the
 * universal status colours (docs/PORTAL-NEUTRAL-PLAN.md). Either way the
 * word and the glyph travel with it, so nothing is read from colour alone.
 */
export function BandChip({
  band, label, size = "md", className, children,
}: { band: Tone; label?: string; size?: "md" | "sm"; className?: string; children?: ReactNode }) {
  return (
    <span className={cx("vm-band", `vm-band--${band}`, size === "sm" && "vm-band--sm", className)}>
      <Icon name={GLYPH[band]} className={cx("vm-band__glyph", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {label ?? (band === "neutral" ? "" : BAND_WORD[band])}
      {children}
    </span>
  );
}
