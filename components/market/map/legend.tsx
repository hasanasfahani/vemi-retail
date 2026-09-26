/* The map's key: the D1 band ramp, darker = needs you sooner, with the
   band word (and count) beside every swatch. It sits in the panel
   header, not over the tiles where it would cover the country. */

import { BAND_COLOR, BAND_EDGE, BAND_LABEL, type Band } from "../ui/health";

const BANDS: Band[] = ["strong", "average", "attention", "critical"];

export default function MapLegend({ counts }: { counts?: Record<Band, number> }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {BANDS.map((band) => (
        <li key={band} className="flex items-center gap-1.5 text-sm text-ink-700">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: BAND_COLOR[band], boxShadow: `inset 0 0 0 1.5px ${BAND_EDGE[band]}` }}
            aria-hidden
          />
          {BAND_LABEL[band]}
          {counts && <span className="mono font-semibold text-ink-900">{counts[band]}</span>}
        </li>
      ))}
    </ul>
  );
}
