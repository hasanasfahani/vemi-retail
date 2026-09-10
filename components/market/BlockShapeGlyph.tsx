/* What a block will look like, in 34 by 26 pixels.

   A rendered preview would cost a full data build per row of a
   twenty-two-entry list, and would mostly show an unreadable
   thumbnail. A reader scanning the picker is not asking "what are the
   numbers" — they are asking "what shape is this, and have I already
   got one". A schematic answers that in a glance and costs nothing. */

import type { BlockShape } from "@/lib/market/reportBlocks";

const FILL = "var(--color-violet)";
const GHOST = "var(--color-line-strong)";

export default function BlockShapeGlyph({ shape }: { shape: BlockShape }) {
  return (
    <span
      className="flex h-[26px] w-[34px] shrink-0 items-center justify-center rounded-[5px] border border-line bg-canvas"
      aria-hidden
    >
      <svg viewBox="0 0 34 26" className="h-[26px] w-[34px]">
        {shape === "tiles" && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={5 + (i % 2) * 13} y={6 + Math.floor(i / 2) * 9} width="11" height="6" rx="1.5" fill={i === 0 ? FILL : GHOST} />
            ))}
          </>
        )}
        {shape === "bars" && (
          <>
            {[16, 12, 9, 6].map((w, i) => (
              <rect key={i} x="5" y={5 + i * 4.5} width={w} height="3" rx="1.5" fill={i === 0 ? FILL : GHOST} />
            ))}
          </>
        )}
        {shape === "dots" && (
          <>
            {[20, 14, 17, 10].map((x, i) => (
              <g key={i}>
                <rect x="5" y={6.5 + i * 4.5} width="24" height="1" rx="0.5" fill={GHOST} />
                <circle cx={x} cy={7 + i * 4.5} r="2" fill={i === 0 ? FILL : GHOST} />
              </g>
            ))}
          </>
        )}
        {shape === "gap" && (
          <>
            <rect x="16.5" y="4" width="1" height="18" fill={GHOST} />
            {[[8, 8.5], [11, 6], [17, 7], [17, 5]].map(([x, w], i) => (
              <rect key={i} x={x} y={5.5 + i * 4.5} width={w} height="3" rx="1.5" fill={i < 2 ? "var(--color-critical)" : "var(--color-good)"} />
            ))}
          </>
        )}
        {shape === "split" && (
          <>
            {[24, 17, 11].map((w, i) => (
              <g key={i}>
                <rect x="5" y={6 + i * 6} width={w} height="4" rx="1.5" fill="none" stroke={GHOST} strokeWidth="1" />
                <rect x="5" y={6 + i * 6} width={w * 0.6} height="4" rx="1.5" fill={FILL} />
              </g>
            ))}
          </>
        )}
        {shape === "stacked" && (
          <>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={6 + i * 8} y={6} width="6" height={8 + i * 2} rx="1" fill={FILL} />
                <rect x={6 + i * 8} y={14 + i * 2} width="6" height={6 - i * 2 + 2} rx="1" fill={GHOST} />
              </g>
            ))}
          </>
        )}
        {shape === "donut" && (
          <>
            <circle cx="17" cy="13" r="7" fill="none" stroke={GHOST} strokeWidth="4" />
            <circle cx="17" cy="13" r="7" fill="none" stroke={FILL} strokeWidth="4" strokeDasharray="18 26" transform="rotate(-90 17 13)" />
          </>
        )}
        {shape === "grid" && (
          <>
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={5 + c * 6.5} y={6 + r * 5} width="5" height="4" rx="1"
                  fill={(r + c) % 3 === 0 ? FILL : GHOST}
                />
              ))
            )}
          </>
        )}
        {shape === "table" && (
          <>
            <rect x="5" y="5" width="24" height="3" rx="1" fill={GHOST} />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x="5" y={10.5 + i * 4} width="8" height="2.5" rx="1" fill={i === 0 ? FILL : GHOST} />
                <rect x="15" y={10.5 + i * 4} width="14" height="2.5" rx="1" fill={GHOST} />
              </g>
            ))}
          </>
        )}
      </svg>
    </span>
  );
}
