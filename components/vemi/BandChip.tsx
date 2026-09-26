import type { ReactNode } from "react";
import { cx } from "./cx";

export type Band = "strong" | "average" | "attention" | "critical";

export const BAND_WORD: Record<Band, string> = {
  strong: "Strong",
  average: "Average",
  attention: "Needs attention",
  critical: "Critical",
};

const GLYPH: Record<Band, string> = { strong: "▲", average: "●", attention: "▼", critical: "▼" };

/**
 * A health band (plan D1). Fill style carries the band, darker = needs
 * you sooner, and the word always travels with it, so nothing is read
 * from color alone.
 */
export function BandChip({
  band, label, size = "md", className, children,
}: { band: Band; label?: string; size?: "md" | "sm"; className?: string; children?: ReactNode }) {
  return (
    <span className={cx("vm-band", `vm-band--${band}`, size === "sm" && "vm-band--sm", className)}>
      <span className="vm-band__glyph" aria-hidden="true">{GLYPH[band]}</span>
      {label ?? BAND_WORD[band]}
      {children}
    </span>
  );
}
