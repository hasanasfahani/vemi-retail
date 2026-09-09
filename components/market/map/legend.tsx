/* The map's key. Separate from the map itself because it belongs in
   the panel header, beside the metric switch, not floating over the
   tiles where it covers the country. */

import { BAND_COLOR, BAND_LABEL, type Band } from "../ui/health";

const BANDS: Band[] = ["strong", "average", "attention", "critical"];

export default function MapLegend({ counts }: { counts?: Record<Band, number> }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      {BANDS.map((band) => (
        <li key={band} className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
            style={{ background: BAND_COLOR[band] }}
            aria-hidden
          />
          {BAND_LABEL[band]}
          {counts && <span className="mono font-semibold text-ink-700">{counts[band]}</span>}
        </li>
      ))}
    </ul>
  );
}
