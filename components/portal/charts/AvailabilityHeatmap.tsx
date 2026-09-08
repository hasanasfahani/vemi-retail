"use client";

/* Outlet × SKU grid — the densest, most persuasive view in the portal.

   Encoding avoids red/green entirely, which is the classic CVD trap:
     · stocked      → single-hue violet ramp, deeper = more facings
     · out of stock → critical red (validated ΔE 30.0 vs the ramp)
     · not listed   → no fill at all; absence reads as absence
   Every cell has a hover read-out and a label; the outlet code opens
   that outlet's detail, and the store table below is the table twin.

   W4 adds the two things 100 × 20 = 2,000 cells needed to be read
   rather than merely admired:

     District rollup   eighteen rows instead of a hundred, so the
                       question "where are the gaps concentrated" is
                       answerable without scrolling a wall. Click a
                       district to drop into its outlets.
     Problems only     hide the rows that are entirely fine. On a good
                       cycle most of the grid is healthy, and healthy
                       cells are exactly the ones nobody needs to scan.

   The rollup deliberately encodes ONE measure — the share of that
   district's listings for a SKU that are out of stock — on one red
   ramp, rather than trying to average facings depth and stock state
   into a single cell. Two measures fighting for one square is how a
   heatmap becomes decoration. */

import { useMemo, useState } from "react";
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

/* Single hue, light → dark, for the rollup's out-of-shelf rate. */
function gapFill(rate: number) {
  if (rate <= 0) return "transparent";
  const mix = rate >= 0.75 ? 100 : rate >= 0.5 ? 76 : rate >= 0.25 ? 52 : 28;
  return `color-mix(in srgb, var(--color-critical) ${mix}%, #fff)`;
}

type Hover = { posId: string; skuId: string; state: CellState; facings: number };
type AreaHover = { area: string; skuId: string; label: string; out: number; listed: number };

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
  const [areaHover, setAreaHover] = useState<AreaHover | null>(null);
  const [drilled, setDrilled] = useState<string | null>(null);
  const [problemsOnly, setProblemsOnly] = useState(false);
  /* Aggregate-then-drill, applied to the OTHER axis. The district
     rollup fixed 100 rows; twenty SKU columns in arbitrary order have
     the same problem in miniature — you cannot find the worst pack
     without reading every column header. Rolling columns up to brands
     turns 20 into 7, and sorting by problem density puts the worst on
     the left where reading starts. */
  const [byBrand, setByBrand] = useState(false);

  /* One lookup pass rather than a find() per cell: at 100 × 20 the
     nested scan is 2,000 linear searches on every render. */
  const index = useMemo(
    () => new Map(cells.map((c) => [`${c.posId}|${c.skuId}`, c])),
    [cells]
  );
  const areaOf = useMemo(
    () => new Map(outlets.map((o) => [o.id, o.area])),
    [outlets]
  );

  /* Columns: either every SKU, or one per brand — in both cases
     ordered worst-first, so the eye lands on the problem. */
  const columns = useMemo(() => {
    const gapRate = new Map<string, { out: number; listed: number }>();
    for (const cell of cells) {
      if (cell.state === "not-listed") continue;
      const key = byBrand ? skuOf(cell.skuId)?.brandId ?? "" : cell.skuId;
      const e = gapRate.get(key) ?? { out: 0, listed: 0 };
      e.listed += 1;
      if (cell.state === "out-of-stock") e.out += 1;
      gapRate.set(key, e);
    }
    const base = byBrand
      ? [...new Set(skus.map((s) => s.brandId))].map((id) => ({
          id,
          label: brandOf(id)?.name ?? id,
          skuIds: skus.filter((s) => s.brandId === id).map((s) => s.id),
        }))
      : skus.map((s) => ({ id: s.id, label: s.name, skuIds: [s.id] }));

    return base.sort((a, b) => {
      const ra = gapRate.get(a.id);
      const rb = gapRate.get(b.id);
      const va = ra?.listed ? ra.out / ra.listed : -1;
      const vb = rb?.listed ? rb.out / rb.listed : -1;
      return vb - va;
    });
  }, [cells, skus, byBrand]);

  /* Drilling into outlets always shows individual SKUs: at that level
     a cell is a stock state and a facing count, and averaging those
     across a brand would invent a number the audit never recorded. */

  /* District × SKU: out of the listings this district holds for a SKU,
     how many are empty right now. */
  const rollup = useMemo(() => {
    const map = new Map<string, { out: number; listed: number }>();
    for (const cell of cells) {
      const area = areaOf.get(cell.posId);
      if (!area || cell.state === "not-listed") continue;
      const colId = byBrand ? skuOf(cell.skuId)?.brandId ?? "" : cell.skuId;
      const key = `${area}|${colId}`;
      const entry = map.get(key) ?? { out: 0, listed: 0 };
      entry.listed += 1;
      if (cell.state === "out-of-stock") entry.out += 1;
      map.set(key, entry);
    }
    return map;
  }, [cells, areaOf, byBrand]);

  const areas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of outlets) counts.set(o.area, (counts.get(o.area) ?? 0) + 1);
    return [...counts.entries()]
      .map(([area, count]) => {
        let out = 0;
        let listed = 0;
        for (const col of columns) {
          const e = rollup.get(`${area}|${col.id}`);
          if (!e) continue;
          out += e.out;
          listed += e.listed;
        }
        return { area, outlets: count, out, listed };
      })
      .sort((a, b) => b.out / (b.listed || 1) - a.out / (a.listed || 1));
  }, [outlets, columns, rollup]);

  const hasGap = useMemo(
    () => (posId: string) =>
      skus.some((s) => index.get(`${posId}|${s.id}`)?.state === "out-of-stock"),
    [skus, index]
  );

  /* The outlets in scope before the filter runs — the denominator the
     control reports against. */
  const scopedOutlets = useMemo(
    () => (drilled ? outlets.filter((o) => o.area === drilled) : outlets),
    [outlets, drilled]
  );
  const withGaps = useMemo(
    () => scopedOutlets.filter((o) => hasGap(o.id)).length,
    [scopedOutlets, hasGap]
  );
  const areasWithGaps = areas.filter((a) => a.out > 0).length;

  const visibleOutlets = problemsOnly
    ? scopedOutlets.filter((o) => hasGap(o.id))
    : scopedOutlets;
  const visibleAreas = problemsOnly ? areas.filter((a) => a.out > 0) : areas;
  const inOutletMode = drilled !== null;
  const outletColumns = skus;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 pb-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {inOutletMode ? <Legend /> : <GapLegend />}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* The count is not decoration. On this panel 83 of 100
              outlets carry at least one gap, and every district does,
              so in some slices this filter correctly removes nothing —
              without the count that reads as a broken control rather
              than as "there is nothing clean to hide here". */}
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
            <input
              type="checkbox"
              checked={problemsOnly}
              onChange={(e) => setProblemsOnly(e.target.checked)}
              className="h-[14px] w-[14px] accent-[var(--color-violet)]"
            />
            Problems only{" "}
            <span className="text-ink-400">
              ({inOutletMode ? withGaps : areasWithGaps} of{" "}
              {inOutletMode ? scopedOutlets.length : areas.length})
            </span>
          </label>
          {!inOutletMode && (
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
            <input
              type="checkbox"
              checked={byBrand}
              onChange={(e) => setByBrand(e.target.checked)}
              className="h-[14px] w-[14px] accent-[var(--color-violet)]"
            />
            Group SKUs by brand{" "}
            <span className="text-ink-400">
              ({columns.length} columns)
            </span>
          </label>
          )}
          {inOutletMode && (
            <button
              type="button"
              onClick={() => setDrilled(null)}
              className="text-[12.5px] font-semibold text-violet-ink hover:underline"
            >
              ← All districts
            </button>
          )}
        </div>
      </div>

      {inOutletMode ? (
        <p className="mb-3 text-[13px] text-ink-500">
          <span className="font-semibold text-ink-900">{drilled}</span> ·{" "}
          {visibleOutlets.length} outlet{visibleOutlets.length === 1 ? "" : "s"}
          {problemsOnly ? " with at least one gap" : ""}
        </p>
      ) : (
        <p className="mb-3 text-[13px] text-ink-500">
          {visibleAreas.length} district{visibleAreas.length === 1 ? "" : "s"},
          worst first. Select one to see its outlets.
        </p>
      )}

      {/* the grid scrolls inside its own box; the page never does */}
      <div className="relative max-h-[560px] overflow-auto pb-1">
        <table className="border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-white" />
              {(inOutletMode
                ? outletColumns.map((s) => ({ id: s.id, label: s.name }))
                : columns
              ).map((col) => (
                <th
                  key={col.id}
                  className="sticky top-0 z-10 h-[92px] w-[22px] bg-white p-0 align-bottom"
                  title={col.label}
                >
                  <div className="flex h-full items-end justify-center">
                    <span
                      className="whitespace-nowrap text-[11px] font-medium text-ink-500"
                      style={{ writingMode: "vertical-rl", rotate: "180deg" }}
                    >
                      {col.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inOutletMode
              ? visibleOutlets.map((outlet) => (
                  <tr key={outlet.id}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white pr-3 text-right text-[12px] font-medium"
                    >
                      <OutletButton posId={outlet.id} className="!text-[12px]" />
                    </th>
                    {outletColumns.map((sku) => {
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
                ))
              : visibleAreas.map((area) => (
                  <tr key={area.area}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white pr-3 text-right text-[12px] font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => setDrilled(area.area)}
                        className="whitespace-nowrap text-[12px] font-medium text-ink-700 hover:text-violet-ink hover:underline"
                      >
                        {area.area}
                        <span className="ml-1 text-ink-400">
                          ({area.outlets})
                        </span>
                      </button>
                    </th>
                    {columns.map((col) => {
                      const e = rollup.get(`${area.area}|${col.id}`);
                      const rate = e && e.listed ? e.out / e.listed : 0;
                      const isHover =
                        areaHover?.area === area.area &&
                        areaHover?.skuId === col.id;
                      return (
                        <td key={col.id} className="p-0">
                          <div
                            tabIndex={0}
                            role="img"
                            aria-label={`${area.area}, ${col.label}: ${
                              e
                                ? `${e.out} of ${e.listed} listings out of stock`
                                : "not listed"
                            }`}
                            title={`${area.area} · ${col.label}`}
                            onMouseEnter={() =>
                              setAreaHover({
                                area: area.area,
                                skuId: col.id,
                                label: col.label,
                                out: e?.out ?? 0,
                                listed: e?.listed ?? 0,
                              })
                            }
                            onMouseLeave={() => setAreaHover(null)}
                            onFocus={() =>
                              setAreaHover({
                                area: area.area,
                                skuId: col.id,
                                label: col.label,
                                out: e?.out ?? 0,
                                listed: e?.listed ?? 0,
                              })
                            }
                            onBlur={() => setAreaHover(null)}
                            className="h-[22px] w-[22px] rounded-[3px] outline-none"
                            style={{
                              background: e ? gapFill(rate) : "transparent",
                              border: e
                                ? "none"
                                : "1px solid var(--color-line)",
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
        {inOutletMode && hover ? (
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
        ) : !inOutletMode && areaHover ? (
          <div className="text-[13px]">
            <span className="font-semibold text-ink-900">{areaHover.area}</span>
            <span className="text-ink-400"> · </span>
            <span className="text-ink-700">{areaHover.label}</span>
            <span className="text-ink-400"> · </span>
            <span
              className="font-semibold"
              style={{
                color: areaHover.out
                  ? "var(--color-critical)"
                  : "var(--color-ink-900)",
              }}
            >
              {areaHover.listed
                ? `${areaHover.out} of ${areaHover.listed} listings empty`
                : "Not listed here"}
            </span>
          </div>
        ) : (
          <span className="text-[13px] text-ink-400">
            {inOutletMode
              ? "Hover any cell for outlet, SKU and facings. Click an outlet code for its full detail."
              : "Hover any cell for that district's gaps on a SKU. Click a district name to see its outlets."}
          </span>
        )}
      </div>
    </div>
  );
}

function GapLegend() {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Listings empty
        </span>
        <span className="flex items-center gap-[2px]">
          {[0.1, 0.3, 0.6, 0.9].map((r) => (
            <span
              key={r}
              className="h-[14px] w-[16px] rounded-[3px]"
              style={{ background: gapFill(r) }}
            />
          ))}
        </span>
        <span className="text-[11px] text-ink-500">few → most</span>
      </div>
      <span className="flex items-center gap-1.5 text-[12px] text-ink-700">
        <span className="h-[14px] w-[16px] rounded-[3px] border border-line" />
        Not listed in this district
      </span>
    </>
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
