/* The execution score. It used to be a ring; the brand avoids pie and
   donut forms, so it is now the figure, a linear gauge on the 0–100
   scale and the band word underneath — the gauge is the glance, the word
   is the fact. The name and props are unchanged for its callers. */

import { BandChip } from "@/components/vemi/BandChip";
import { Gauge } from "@/components/vemi/Gauge";
import { scoreBand } from "./health";

export default function ScoreRing({
  score,
  size = 104,
  caption,
}: {
  score: number;
  size?: number;
  caption?: string;
}) {
  const band = scoreBand(score);
  const figure = size >= 120 ? 56 : size >= 90 ? 44 : 36;
  return (
    <div className="flex w-full min-w-[120px] flex-col items-start" style={{ maxWidth: Math.max(160, size * 1.6) }}>
      <span className="tnum leading-none" style={{ fontSize: figure }}>
        {Math.round(score)}
        <span className="ml-1 font-mono text-xs font-medium tracking-normal text-text-muted">/ 100</span>
      </span>
      <Gauge value={score} max={100} band={band} className="mt-3 w-full" label={`Score ${Math.round(score)} of 100`} />
      <span className="mt-2">
        <BandChip band={band} size="sm" />
      </span>
      {caption && <span className="mt-1 text-xs text-text-muted">{caption}</span>}
    </div>
  );
}
