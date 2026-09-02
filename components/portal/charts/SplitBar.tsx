"use client";

/* Two-segment part-to-whole per row: chilled cooler vs ambient shelf.
   Two classes only, so the accent carries one and de-emphasis gray the
   other, separated by a 2px surface gap rather than a stroke. */

export type SplitRow = {
  id: string;
  label: string;
  a: number;
  b: number;
  emphasis?: boolean;
};

export default function SplitBar({
  rows,
  aLabel,
  bLabel,
}: {
  rows: SplitRow[];
  aLabel: string;
  bLabel: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-4">
        <LegendKey color="var(--color-violet)" label={aLabel} />
        <LegendKey color="var(--color-chart-context)" label={bLabel} />
      </div>

      {rows.map((row) => {
        const total = row.a + row.b || 1;
        const aPct = (row.a / total) * 100;
        return (
          <div
            key={row.id}
            className="flex flex-col gap-1 py-[5px] sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="flex items-baseline justify-between gap-3 text-[13px] sm:block sm:w-[118px] sm:shrink-0 sm:text-right">
              <span
                className={row.emphasis ? "font-semibold text-ink-900" : "text-ink-700"}
              >
                {row.label}
              </span>
              <span className="mono shrink-0 font-semibold text-ink-900 sm:hidden">
                {Math.round(aPct)}% / {Math.round(100 - aPct)}%
              </span>
            </div>

            <div className="flex h-[14px] min-w-0 flex-1 overflow-hidden rounded-[4px]">
              <div
                style={{
                  width: `${aPct}%`,
                  background: "var(--color-violet)",
                  /* the 2px separator is surface, not a border */
                  marginRight: 2,
                }}
                title={`${aLabel}: ${row.a} facings`}
              />
              <div
                style={{
                  width: `${100 - aPct}%`,
                  background: "var(--color-chart-context)",
                }}
                title={`${bLabel}: ${row.b} facings`}
              />
            </div>

            <div className="mono hidden w-[86px] shrink-0 text-right text-[13px] text-ink-700 sm:block">
              <span className="font-semibold text-ink-900">
                {Math.round(aPct)}%
              </span>
              <span className="text-ink-400"> / {Math.round(100 - aPct)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-ink-700">
      <span
        className="h-[10px] w-[10px] rounded-[2px]"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
