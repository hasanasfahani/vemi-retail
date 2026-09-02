"use client";

/* Outlet × SKU grid — the densest, most persuasive view in the portal.

   Encoding avoids red/green entirely, which is the classic CVD trap:
     · stocked      → single-hue violet ramp, deeper = more facings
     · out of stock → critical red (validated ΔE 30.0 vs the ramp)
     · not listed   → no fill at all; absence reads as absence
   Every cell has a hover read-out and a label; the outlet code opens
   that outlet's detail, and the store table below is the table twin. */

import { useState } from "react";
import {
  skuName,
  posLabel,
  brandOf,
  skuOf,
  type MatrixCell,
  type Pos,
  type Sku,
  type CellState,
} from "@/lib/portalData";
import { OutletButton } from "@/components/portal/OutletDrawer";

const STOCK_RAMP = [
  "var(--color-stock-1)",
  "var(--color-stock-2)",
  "var(--color-stock-3)",
  "var(--color-stock-4)",
];

/* Facings bucket → ramp step. Four bins keeps adjacent steps apart. */
function rampStep(facings: number) {
  if (facings <= 2) return STOCK_RAMP[0];
  if (facings <= 4) return STOCK_RAMP[1];
  if (facings <= 7) return STOCK_RAMP[2];
  return STOCK_RAMP[3];
}

function cellFill(state: CellState, facings: number) {
  if (state === "not-listed") return "transparent";
  if (state === "out-of-stock") return "var(--color-critical)";
  return rampStep(facings);
}

type Hover = { posId: string; skuId: string; state: CellState; facings: number };

export default function AvailabilityHeatmap({
  cells,
  outlets,
  skus,
}: {
  cells: MatrixCell[];
  outlets: Pos[];
  skus: Sku[];
}) {
  const [hover, setHover] = useState<Hover | null>(null);

  /* One lookup pass rather than a find() per cell: at 100 × 20 the
     nested scan is 2,000 linear searches on every render. */
  const index = new Map(cells.map((c) => [`${c.posId}|${c.skuId}`, c]));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-4">
        <Legend />
      </div>

      {/* the grid scrolls inside its own box; the page never does */}
      <div className="relative max-h-[560px] overflow-auto pb-1">
        <table className="border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-white" />
              {skus.map((sku) => (
                <th
                  key={sku.id}
                  className="sticky top-0 z-10 h-[92px] w-[22px] bg-white p-0 align-bottom"
                  title={sku.name}
                >
                  <div className="flex h-full items-end justify-center">
                    <span
                      className="whitespace-nowrap text-[11px] font-medium text-ink-500"
                      style={{ writingMode: "vertical-rl", rotate: "180deg" }}
                    >
                      {sku.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outlets.map((outlet) => (
              <tr key={outlet.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white pr-3 text-right text-[12px] font-medium"
                >
                  <OutletButton posId={outlet.id} className="!text-[12px]" />
                </th>
                {skus.map((sku) => {
                  const cell = index.get(`${outlet.id}|${sku.id}`);
                  if (!cell) return <td key={sku.id} />;
                  const isHover =
                    hover?.posId === outlet.id && hover?.skuId === sku.id;
                  return (
                    <td key={sku.id} className="p-0">
                      <div
                        tabIndex={0}
                        role="img"
                        aria-label={`${outlet.code}, ${sku.name}: ${
                          cell.state === "in-stock"
                            ? `${cell.facings} facings`
                            : cell.state === "out-of-stock"
                              ? "out of stock"
                              : "not listed"
                        }`}
                        title={`${outlet.code} · ${sku.name}`}
                        onMouseEnter={() =>
                          setHover({
                            posId: outlet.id,
                            skuId: sku.id,
                            state: cell.state,
                            facings: cell.facings,
                          })
                        }
                        onMouseLeave={() => setHover(null)}
                        onFocus={() =>
                          setHover({
                            posId: outlet.id,
                            skuId: sku.id,
                            state: cell.state,
                            facings: cell.facings,
                          })
                        }
                        onBlur={() => setHover(null)}
                        className="h-[22px] w-[22px] rounded-[3px] outline-none"
                        style={{
                          background: cellFill(cell.state, cell.facings),
                          border:
                            cell.state === "not-listed"
                              ? "1px solid var(--color-line)"
                              : "none",
                          boxShadow: isHover
                            ? "0 0 0 2px var(--color-ink-900)"
                            : undefined,
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* hover read-out — a fixed slot, so the grid never jumps */}
      <div className="mt-3 flex h-[42px] items-center rounded-lg bg-canvas px-3">
        {hover ? (
          <div className="text-[13px]">
            <span className="font-semibold text-ink-900">
              {posLabel(hover.posId)}
            </span>
            <span className="text-ink-400"> · </span>
            <span className="text-ink-700">{skuName(hover.skuId)}</span>
            <span className="text-ink-400"> · </span>
            <span
              className="font-semibold"
              style={{
                color:
                  hover.state === "out-of-stock"
                    ? "var(--color-critical)"
                    : "var(--color-ink-900)",
              }}
            >
              {hover.state === "in-stock"
                ? `${hover.facings} facings`
                : hover.state === "out-of-stock"
                  ? "Out of stock"
                  : "Not listed"}
            </span>
            <span className="text-ink-400">
              {" "}
              · {brandOf(skuOf(hover.skuId)!.brandId)?.name}
            </span>
          </div>
        ) : (
          <span className="text-[13px] text-ink-400">
            Hover any cell for outlet, SKU and facings. Click an outlet code for
            its full detail.
          </span>
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Facings
        </span>
        <span className="flex items-center gap-[2px]">
          {STOCK_RAMP.map((c, i) => (
            <span
              key={c}
              className="h-[14px] w-[16px] rounded-[3px]"
              style={{ background: c }}
              title={["1–2", "3–4", "5–7", "8+"][i]}
            />
          ))}
        </span>
        <span className="text-[11px] text-ink-500">1 → 8+</span>
      </div>

      <span className="flex items-center gap-1.5 text-[12px] text-ink-700">
        <span
          className="h-[14px] w-[16px] rounded-[3px]"
          style={{ background: "var(--color-critical)" }}
        />
        Out of stock
      </span>

      <span className="flex items-center gap-1.5 text-[12px] text-ink-700">
        <span className="h-[14px] w-[16px] rounded-[3px] border border-line" />
        Not listed
      </span>
    </>
  );
}
