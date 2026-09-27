/* The Insight V key visual (Brand Guide §6): the V drawn in solid
   Violet blocks inside a Violet 100 block field. Live SVG on the mark's
   own block proportions (22 × 14, 6 row gap), so it stays crisp at any
   size and needs no image.

   The field is even and thins toward the headline (brand: "fade toward
   the logo or headline"), and the V's rows settle in order on load — surface,
   convergence, insight point — which is the idea of the mark played
   once. Seeded, so server and client draw the same field. */

const W = 22;
const H = 14;
const GX = 8;
const GY = 8;
const COLS = 12;
const ROWS = 11;

/* The V: pairs stepping inward one column a row, resolving to one. */
const V_ROWS: number[][] = [
  [2, 10],
  [3, 9],
  [4, 8],
  [5, 7],
  [6],
];
const V_TOP = 2;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default function InsightV({ className }: { className?: string }) {
  const rand = rng(11);
  const vCells = new Set<string>();
  V_ROWS.forEach((cols, r) => cols.forEach((c) => vCells.add(`${c}|${r + V_TOP}`)));

  /* An even Violet 100 grid, like the brand's key visual, so the only
     solid shapes are the V. It thins over the three columns nearest the
     headline and is full everywhere else. */
  const field: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (vCells.has(`${c}|${r}`)) continue;
      const keep = c >= 3 ? 1 : 0.25 + c * 0.22;
      if (rand() > keep) continue;
      field.push({ x: c * (W + GX), y: r * (H + GY) });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${COLS * (W + GX) - GX} ${ROWS * (H + GY) - GY}`}
      className={className}
      role="img"
      aria-label="The Vemi Insight V: many market signals converging on one decision"
    >
      {field.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={W}
          height={H}
          rx={2.5}
          fill="var(--vm-primary-tint)"
        />
      ))}
      {V_ROWS.map((cols, r) =>
        cols.map((c) => (
          <rect
            key={`${c}-${r}`}
            className="insight-v-block"
            style={{ animationDelay: `${r * 110}ms` }}
            x={c * (W + GX)}
            y={(r + V_TOP) * (H + GY)}
            width={W}
            height={H}
            rx={2.5}
            fill="var(--vm-primary)"
          />
        ))
      )}
    </svg>
  );
}
