/* A shelf bay drawn in the same idiom as the portal's ShelfScene:
   packs standing on boards, an empty slot drawn as a real gap where
   the SKU should have been.

   Deliberately NOT importing the portal's ShelfScene — that component
   reads the market data model (Cell[], the SKU catalogue, brand
   colours), and wiring a marketing page into the portal's data
   pipeline to draw a picture would couple the two for no benefit.
   This takes a plain array instead. */

export type SlotState = "planned" | "wrong" | "empty";

const SHELVES = ["Upper", "Eye level", "Lower"] as const;

/* Varied pack shapes so the bay reads as a shelf rather than a grid. */
const SHAPES = [
  { w: 17, h: 34, can: false },
  { w: 16, h: 26, can: true },
  { w: 20, h: 38, can: false },
  { w: 15, h: 23, can: true },
  { w: 17, h: 32, can: false },
  { w: 15, h: 28, can: false },
];

const FILL: Record<Exclude<SlotState, "empty">, string> = {
  planned: "var(--color-violet)",
  wrong: "var(--color-warn)",
};

export default function PlanogramScene({
  rows,
  height = 156,
}: {
  rows: SlotState[][];
  height?: number;
}) {
  const W = 320;
  const shelfH = height / rows.length;
  const cols = rows[0]?.length ?? 6;
  const slotW = (W - 20) / cols;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Shelf bay showing planogram compliance">
      <rect x="0" y="0" width={W} height={height} rx="8" fill="#f2f3f7" />

      {rows.map((row, r) => {
        const top = r * shelfH;
        const base = top + shelfH - 8;

        return (
          <g key={r}>
            {/* the board */}
            <rect x={4} y={base} width={W - 8} height={4.5} rx={1.5} fill="#c9ccd4" />
            <rect x={4} y={base + 4.5} width={W - 8} height={1.8} fill="#b3b7c1" opacity={0.7} />
            <text x={8} y={top + 10} fontSize={6.5} fill="var(--color-ink-600)" letterSpacing={0.4}>
              {SHELVES[r]?.toUpperCase()}
            </text>

            {row.map((state, c) => {
              const shape = SHAPES[c % SHAPES.length];
              const slotLeft = 10 + c * slotW;
              const packTop = base - shape.h;
              const pairW = shape.w * 2 + 1.5;
              const left = slotLeft + (slotW - pairW) / 2;

              if (state === "empty") {
                return (
                  <rect
                    key={c}
                    x={left}
                    y={packTop}
                    width={pairW}
                    height={shape.h}
                    rx={3}
                    fill="none"
                    stroke="var(--color-critical)"
                    strokeWidth={1.4}
                    strokeDasharray="3 2.5"
                  />
                );
              }

              return (
                <g key={c}>
                  {[0, 1].map((i) => {
                    const px = left + i * (shape.w + 1.5);
                    return (
                      <g key={i}>
                        <rect
                          x={px}
                          y={packTop}
                          width={shape.w}
                          height={shape.h}
                          rx={shape.can ? 2 : 3}
                          fill={FILL[state]}
                        />
                        {/* lighter band, so a row reads as packs not a block */}
                        <rect
                          x={px}
                          y={packTop + shape.h * 0.42}
                          width={shape.w}
                          height={shape.h * 0.2}
                          fill="#ffffff"
                          opacity={0.3}
                        />
                        {!shape.can && (
                          <rect
                            x={px + shape.w / 2 - 2.2}
                            y={packTop - 3.5}
                            width={4.4}
                            height={3.5}
                            rx={1}
                            fill={FILL[state]}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
