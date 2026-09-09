"use client";

/* THE SHELF, DRAWN FROM THE AUDIT ROWS.

   The brief asks for shelf photography and detection overlays. There
   is no camera in a frontend demo, so this draws the shelf instead —
   from the same rows every chart on the page reads. Each pack on the
   shelf is a real cell: its brand, its facing count, its shelf
   position. An empty slot is a real out-of-stock, in the place the
   SKU would occupy if the outlet had it.

   That is the point. A stock photograph would put a full shelf behind
   a card claiming three lines are empty. This cannot disagree with the
   data, because it IS the data — and the "detection" boxes label
   things that were genuinely observed rather than decorating a picture
   with plausible-looking labels.

   Packs are drawn in the portal's brand palette, not in Pepsi red and
   Coca-Cola red: a reader matching this shelf to the donut above it
   needs the same colour to mean the same brand in both. */

import { useMemo } from "react";
import { brandColor } from "./charts/theme";
import { brandOf, skuOf } from "@/lib/market";
import type { Cell } from "@/lib/market/types";

type Slot = {
  key: string;
  skuId: string;
  brandId: string;
  name: string;
  pack: string;
  facings: number;
  empty: boolean;
};

const SHELVES = [
  { id: "upper", label: "Upper" },
  { id: "eye", label: "Eye level" },
  { id: "lower", label: "Lower" },
] as const;

/* Bottles are taller than cans, and a 2.25L is taller than a 500ml.
   Drawn to scale against each other so the shelf reads as a shelf. */
const PACK_SHAPE: Record<string, { w: number; h: number; can: boolean }> = {
  "can-250": { w: 15, h: 32, can: true },
  "can-330": { w: 16, h: 38, can: true },
  "pet-500": { w: 17, h: 50, can: false },
  "pet-1000": { w: 21, h: 62, can: false },
  "pet-1500": { w: 23, h: 68, can: false },
  "pet-2250": { w: 26, h: 76, can: false },
  "glass-300": { w: 15, h: 40, can: false },
};
const DEFAULT_SHAPE = { w: 18, h: 48, can: false };

export default function ShelfScene({
  cells,
  overlays = false,
  height = 210,
  maxFacings = 26,
}: {
  cells: Cell[];
  /* Detection boxes and labels — the "AI overlay" the brief asks for,
     drawn over observations that are already in the payload. */
  overlays?: boolean;
  height?: number;
  /* Facings drawn per shelf before the row is compressed; a
     hypermarket bay would otherwise draw a hundred bottles. */
  maxFacings?: number;
}) {
  const rows = useMemo(() => {
    const byPosition = new Map<string, Slot[]>();
    for (const cell of cells) {
      const sku = skuOf(cell.skuId);
      if (!sku) continue;
      /* An out-of-stock cell has no shelf position recorded — nothing
         was there to observe. It is drawn on the eye-level shelf as an
         empty slot, which is where the outlet's own planogram would
         have put it. */
      const shelf = cell.state === "in-stock" ? (cell.position ?? "lower") : "eye";
      const slot: Slot = {
        key: `${cell.posId}-${cell.skuId}`,
        skuId: cell.skuId,
        brandId: sku.brandId,
        name: sku.name,
        pack: sku.pack,
        facings: cell.state === "in-stock" ? cell.facings : 1,
        empty: cell.state === "out-of-stock",
      };
      byPosition.set(shelf, [...(byPosition.get(shelf) ?? []), slot]);
    }
    return byPosition;
  }, [cells]);

  const shelfHeight = height / SHELVES.length;

  return (
    <div
      className="relative overflow-hidden rounded-[10px] border border-line"
      style={{ background: "linear-gradient(#f8f8fa, #eef0f4)" }}
    >
      <svg
        viewBox={`0 0 320 ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Shelf drawn from this outlet's audited rows"
      >
        {SHELVES.map((shelf, index) => {
          const slots = rows.get(shelf.id) ?? [];
          const top = index * shelfHeight;
          const base = top + shelfHeight - 9;

          /* Lay the packs out left to right, CLAMPING each group to
             what is left of the board.

             This used to `break` the moment a group did not fit, and
             the first group is the widest — a hypermarket bay of 39
             facings is 700px of bottles against a 320px board. The
             result was that the largest stores in the panel, 225 of
             742 outlets, drew a completely empty shelf while the
             numbers beside them reported full stock. A drawing that
             contradicts its own caption is worse than no drawing.

             So a group now draws as many packs as fit, and the scene
             reports what it had to leave out. */
          let x = 10;
          const drawn: { slot: Slot; x: number; n: number }[] = [];
          let budget = maxFacings;
          let dropped = 0;
          for (const slot of slots) {
            const shape = PACK_SHAPE[slot.pack] ?? DEFAULT_SHAPE;
            const wanted = Math.max(1, Math.min(slot.facings, budget));
            const room = Math.floor((310 - x) / (shape.w + 1.5));
            if (room < 1) {
              dropped += slot.facings;
              continue;
            }
            const n = Math.min(wanted, room);
            dropped += Math.max(0, slot.facings - n);
            drawn.push({ slot, x, n });
            x += n * (shape.w + 1.5) + 5;
            budget -= n;
            if (budget <= 0) {
              dropped += slots
                .slice(slots.indexOf(slot) + 1)
                .reduce((sum, rest) => sum + rest.facings, 0);
              break;
            }
          }

          return (
            <g key={shelf.id}>
              {/* the board */}
              <rect x={4} y={base} width={312} height={5} rx={1.5} fill="#c9ccd4" />
              <rect x={4} y={base + 5} width={312} height={2} fill="#b3b7c1" opacity={0.7} />
              <text x={8} y={top + 12} fontSize={7.5} fill="var(--color-ink-400)" letterSpacing={0.4}>
                {shelf.label.toUpperCase()}
              </text>

              {dropped > 0 && (
                <text
                  x={312} y={top + 12} textAnchor="end"
                  fontSize={7} fill="var(--color-ink-400)"
                >
                  +{dropped} more
                </text>
              )}

              {drawn.map(({ slot, x: left, n }) => {
                const shape = PACK_SHAPE[slot.pack] ?? DEFAULT_SHAPE;
                const color = brandColor(slot.brandId);
                const width = n * (shape.w + 1.5) - 1.5;
                const packTop = base - shape.h;

                if (slot.empty) {
                  return (
                    <g key={slot.key}>
                      <rect
                        x={left} y={packTop} width={Math.max(width, 20)} height={shape.h}
                        rx={3}
                        fill="none"
                        stroke="var(--color-critical)"
                        strokeWidth={1.4}
                        strokeDasharray="3 2.5"
                        opacity={0.85}
                      />
                      {overlays && (
                        <text
                          x={left + 2} y={packTop - 3}
                          fontSize={6.5} fontWeight={700} fill="var(--color-critical)"
                        >
                          OUT OF STOCK · {slot.name}
                        </text>
                      )}
                    </g>
                  );
                }

                return (
                  <g key={slot.key}>
                    {Array.from({ length: n }, (_, i) => {
                      const px = left + i * (shape.w + 1.5);
                      return (
                        <g key={i}>
                          <rect
                            x={px} y={packTop} width={shape.w} height={shape.h}
                            rx={shape.can ? 2 : 3}
                            fill={color}
                          />
                          {/* a lighter band, so a row of packs reads as
                              packs rather than as a solid block */}
                          <rect
                            x={px} y={packTop + shape.h * 0.42}
                            width={shape.w} height={shape.h * 0.2}
                            fill="#ffffff" opacity={0.28}
                          />
                          {!shape.can && (
                            <rect
                              x={px + shape.w / 2 - 2.4} y={packTop - 4}
                              width={4.8} height={4.5} rx={1}
                              fill={color} opacity={0.85}
                            />
                          )}
                        </g>
                      );
                    })}
                    {overlays && (
                      <>
                        <rect
                          x={left - 1.5} y={packTop - 2}
                          width={width + 3} height={shape.h + 4}
                          fill="none" stroke="var(--color-violet)" strokeWidth={1} opacity={0.9}
                          rx={2}
                        />
                        <text
                          x={left} y={packTop - 4}
                          fontSize={6.5} fontWeight={700} fill="var(--color-violet-ink)"
                        >
                          {brandOf(slot.brandId)?.name ?? slot.brandId} · {n}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
