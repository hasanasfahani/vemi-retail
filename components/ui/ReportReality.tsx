/* "Report vs. reality" — the Challenge section's one visual argument.
   Distributor report claims 96% available; Vemi's on-shelf audit finds 73%.
   The 23% gap (counted but not actually on shelf) is the blind spot. */

const REPORT = 96;
const SHELF = 73;
const GAP = REPORT - SHELF;

export default function ReportReality() {
  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between">
        <span className="t-eyebrow">Report vs. reality</span>
        <span className="chip !py-1 text-xs">
          <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
          Live audit · Baghdad
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* Distributor report — the claim */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink-500">Distributor report</span>
            <span className="tnum !text-sm text-ink-500">{REPORT}%</span>
          </div>
          <div className="h-3.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full" style={{ width: `${REPORT}%`, background: "var(--color-line-strong)" }} />
          </div>
          <p className="mt-1 text-xs text-ink-400">What your paperwork says is on shelf</p>
        </div>

        {/* On-shelf verified — the truth, with the gap exposed in red */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink-900">On-shelf, verified by Vemi</span>
            <span className="tnum !text-sm" style={{ color: "var(--color-violet-ink)" }}>{SHELF}%</span>
          </div>
          <div className="relative h-3.5 overflow-hidden rounded-full bg-line">
            {/* verified availability */}
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${SHELF}%`, background: "var(--color-violet)" }} />
            {/* the blind spot: counted by the report, not actually on shelf */}
            <div
              className="absolute inset-y-0"
              style={{
                left: `${SHELF}%`,
                width: `${GAP}%`,
                background:
                  "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-critical) 32%, #fff) 0 4px, color-mix(in srgb, var(--color-critical) 14%, #fff) 4px 8px)",
              }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-400">What shoppers actually see</p>
        </div>
      </div>

      {/* the punchline */}
      <div className="mt-6 flex items-center gap-4 rounded-xl border border-line bg-canvas p-4">
        <span className="tnum shrink-0 text-4xl" style={{ color: "var(--color-critical)" }}>{GAP}%</span>
        <p className="text-sm leading-snug text-ink-700">
          <span className="font-semibold text-ink-900">blind spot</span> — SKUs your reports
          count that shoppers can&rsquo;t find on the shelf.
        </p>
      </div>
    </div>
  );
}
