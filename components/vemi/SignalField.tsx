/* The brand pattern: blocks from the mark scattered on its grid, about
   one in twenty an accent "signal". Deterministic (seeded) so server and
   client render the same field. Dense at the edge it is anchored to,
   thinning toward the content (brand guide: fade toward the logo or
   headline). Marketing surfaces only — never behind data. */

import { cx } from "./cx";

export type SignalColorway = "paper" | "violet" | "ink";

const COLORS: Record<SignalColorway, { block: string; signal: string }> = {
  paper: { block: "var(--vm-primary-tint)", signal: "var(--vm-primary)" },
  violet: { block: "color-mix(in srgb, var(--vm-on-primary) 14%, transparent)", signal: "var(--vm-on-primary)" },
  ink: { block: "var(--vm-ink-800)", signal: "var(--vm-primary-on-ink)" },
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function SignalField({
  colorway = "paper", cols = 18, rows = 12, fadeFrom = "right", seed = 7, className,
}: {
  colorway?: SignalColorway;
  cols?: number;
  rows?: number;
  /** The dense edge. The field thins toward the opposite side. */
  fadeFrom?: "right" | "left" | "bottom" | "top";
  seed?: number;
  className?: string;
}) {
  const rand = rng(seed);
  const W = 22, H = 14, GX = 8, GY = 6;
  const c = COLORS[colorway];
  const cells: { x: number; y: number; accent: boolean }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const t =
        fadeFrom === "right" ? k / (cols - 1)
        : fadeFrom === "left" ? 1 - k / (cols - 1)
        : fadeFrom === "bottom" ? r / (rows - 1)
        : 1 - r / (rows - 1);
      if (rand() > 0.12 + 0.78 * t) continue;
      cells.push({ x: k * (W + GX), y: r * (H + GY), accent: rand() < 0.05 });
    }
  }
  return (
    <svg
      aria-hidden="true"
      className={cx("pointer-events-none", className)}
      viewBox={`0 0 ${cols * (W + GX)} ${rows * (H + GY)}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {cells.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={W} height={H} rx={2.5} fill={b.accent ? c.signal : c.block} />
      ))}
    </svg>
  );
}
