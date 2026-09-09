/* The execution score as a ring. One arc, banded by the score's own
   thresholds, with the number in the middle and the band written
   underneath — the ring is the glance, the word is the fact. */

import { BAND_COLOR, BAND_LABEL, scoreBand } from "./health";

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
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="var(--color-line)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={BAND_COLOR[band]} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c - filled}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold leading-none tracking-tight text-ink-900" style={{ fontSize: size * 0.28 }}>
            {Math.round(score)}
          </span>
          <span className="mono mt-0.5 text-[10px] text-ink-400">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-[12px] font-semibold text-ink-700">{BAND_LABEL[band]}</span>
      {caption && <span className="mt-0.5 text-[11px] text-ink-400">{caption}</span>}
    </div>
  );
}
