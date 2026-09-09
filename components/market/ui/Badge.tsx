/* Status pill. Swatch plus word, never colour alone — a colourblind
   reader and a printed page both have to be able to read the state. */

import { BAND_CLASS, BAND_LABEL, type Band } from "./health";

export default function Badge({
  band,
  label,
  size = "md",
}: {
  band: Band;
  /* Overrides the band's own word where the domain has a better one
     ("Out of stock" rather than "Critical"). */
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${BAND_CLASS[band]} ${
        size === "sm" ? "px-1.5 py-[1px] text-[10.5px]" : "px-2 py-[2px] text-[11.5px]"
      }`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        aria-hidden
      />
      {label ?? BAND_LABEL[band]}
    </span>
  );
}
