/* Status pill: the brand BandChip (plan D1). Fill style plus word, never
   colour alone — a colourblind reader and a printed page both have to be
   able to read the state. */

import { BandChip, type Tone } from "@/components/vemi/BandChip";

export default function Badge({
  band,
  label,
  size = "md",
}: {
  band: Tone;
  /* Overrides the band's own word where the domain has a better one
     ("Out of stock" rather than "Critical"). */
  label?: string;
  size?: "sm" | "md";
}) {
  return <BandChip band={band} label={label} size={size} />;
}
