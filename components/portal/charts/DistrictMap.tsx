"use client";

/* Erbil by district — the numbers as geography.

   A ranked bar tells you Setaqan is weak. This tells you the weakness
   sits in one quadrant of the city, which is what decides how a rep's
   day gets routed.

   Encoding: whichever measure the host page is about, on a validated
   single-hue red ramp — semantic heat, so more red is always more of
   the thing you are hunting. Circle area carries outlet count on every
   page, so size means one thing wherever this map appears.
   Clicking a district applies it as a filter to the whole page.

   Positions are approximate district centroids (see lib/portal.ts):
   true bearing and rough distance from the Citadel, not boundaries. */

import { useCallback, useMemo, useState } from "react";
import {
  districtPoints,
  ERBIL_CITADEL,
  type DistrictPoint,
} from "@/lib/portal";

/* Validated with the data-viz palette checker (ordinal, light surface):
   monotone lightness, ΔL ≥ 0.06, single hue, light end 2.15:1. */
const GAP_RAMP = ["#e19d9d", "#d47373", "#c74a4a", "#b32020"];
const NO_DATA = "var(--color-line)";

export type DistrictDatum = {
  name: string;
  /* Circle size — kept as outlets audited on every page, so the size
     channel means the same thing wherever this map appears. */
  outlets: number;
  /* Drives the fill. Each page picks the measure it is actually about:
     out-of-shelf rate on Availability, lost facing-days on the gap
     page. Higher always means more of the problem. */
  value: number;
  /* Read-out lines for the hover panel. */
  rows: { label: string; value: string; tone?: "critical" }[];
};

const VIEW = { w: 100, h: 88 };

function rampStep(value: number, breaks: number[]) {
  if (value <= breaks[0]) return GAP_RAMP[0];
  if (value <= breaks[1]) return GAP_RAMP[1];
  if (value <= breaks[2]) return GAP_RAMP[2];
  return GAP_RAMP[3];
}

export default function DistrictMap({
  data,
  selected,
  onSelect,
  legendLabel,
  formatValue,
}: {
  data: DistrictDatum[];
  selected: string[];
  onSelect: (district: string) => void;
  /* What the colour means on this page. */
  legendLabel: string;
  formatValue: (value: number) => string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const byName = useMemo(
    () => new Map(data.map((d) => [d.name, d])),
    [data]
  );

  /* Projection: true bearing from the Citadel, compressed distance.

     A straight geographic plot is unreadable here. Erbil's old city
     packs Downtown, Setaqan, Kurdistan and Minara inside a kilometre,
     while Baharka and Kasnazan sit fifteen kilometres out — so a linear
     map collapses the centre into one blob and spends most of its area
     on empty desert.

     Each district therefore keeps its real compass bearing from the
     Citadel, and its distance is put through a power curve that opens
     up the core while keeping the outer suburbs outside the ring. What
     survives is what a rep reads off it — which side of town, and
     roughly how far out. Absolute distances do not survive, which is
     why the caption says schematic. */
  const projection = useMemo(() => {
    const LAT_CORRECTION = Math.cos((ERBIL_CITADEL.lat * Math.PI) / 180);
    const CENTRE = { x: VIEW.w / 2, y: VIEW.h / 2 };
    const MAX_RADIUS = 38;
    const CURVE = 0.5;

    const offsets = districtPoints.map((p) => ({
      dx: (p.lng - ERBIL_CITADEL.lng) * LAT_CORRECTION,
      dy: p.lat - ERBIL_CITADEL.lat,
    }));
    const maxDistance = Math.max(
      ...offsets.map((o) => Math.hypot(o.dx, o.dy)),
      1e-6
    );

    return (p: { lat: number; lng: number }) => {
      const dx = (p.lng - ERBIL_CITADEL.lng) * LAT_CORRECTION;
      const dy = p.lat - ERBIL_CITADEL.lat;
      const distance = Math.hypot(dx, dy);
      if (distance < 1e-9) return CENTRE;
      const scaled =
        Math.pow(distance / maxDistance, CURVE) * MAX_RADIUS;
      return {
        x: CENTRE.x + (dx / distance) * scaled,
        y: CENTRE.y - (dy / distance) * scaled,
      };
    };
  }, []);

  /* Quartile breaks over the districts actually in scope, so the ramp
     always spends its range on the data in front of the reader. */
  const breaks = useMemo(() => {
    const rates = data.map((d) => d.value).sort((a, b) => a - b);
    if (!rates.length) return [0, 0, 0];
    const at = (q: number) => rates[Math.floor((rates.length - 1) * q)];
    return [at(0.25), at(0.5), at(0.75)];
  }, [data]);

  const maxOutlets = Math.max(...data.map((d) => d.outlets), 1);
  /* Marks stay small: at 4–8 outlets per district the size channel has
     little work to do, and fat circles would swallow the centre. */
  const radius = useCallback(
    (outlets: number) => 1.9 + Math.sqrt(outlets / maxOutlets) * 1.8,
    [maxOutlets]
  );

  /* Label placement.

     The old city packs Downtown, Setaqan, Kurdistan and Iskan into a
     few hundred metres, so labels genuinely collide. Rather than
     stacking them — which detaches a name from its circle — each label
     is tried below its circle, then above, and dropped if neither
     fits. Districts with the most outlets get first claim, and a
     dropped name is still on hover, on focus and in the table below.
     Text width is estimated from the glyph count at this font size;
     positions never change with the data, so the layout is stable. */
  const labels = useMemo(() => {
    const CHAR_W = 1.12;
    const LINE_H = 2.6;
    const placed: { x1: number; x2: number; y1: number; y2: number }[] = [];
    const result = new Map<string, "below" | "above" | "none">();

    const ordered = [...districtPoints].sort(
      (a, b) =>
        (byName.get(b.name)?.outlets ?? 0) - (byName.get(a.name)?.outlets ?? 0)
    );

    for (const point of ordered) {
      const datum = byName.get(point.name);
      const { x, y } = projection(point);
      const r = datum ? radius(datum.outlets) : 2.4;
      const text = point.name.replace(" / Qaysari", "");
      const halfWidth = (text.length * CHAR_W) / 2;

      const candidates: { pos: "below" | "above"; y: number }[] = [
        { pos: "below", y: y + r + 2.6 },
        { pos: "above", y: y - r - 1.4 },
      ];

      let chosen: "below" | "above" | "none" = "none";
      for (const candidate of candidates) {
        const box = {
          x1: x - halfWidth,
          x2: x + halfWidth,
          y1: candidate.y - LINE_H,
          y2: candidate.y,
        };
        const clash = placed.some(
          (p) => box.x1 < p.x2 && p.x1 < box.x2 && box.y1 < p.y2 && p.y1 < box.y2
        );
        if (!clash) {
          placed.push(box);
          chosen = candidate.pos;
          break;
        }
      }
      result.set(point.name, chosen);
    }
    return result;
  }, [byName, projection, radius]);

  const citadel = projection(ERBIL_CITADEL);
  const active = hover ? byName.get(hover) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_224px]">
      <div
        className="relative mx-auto w-full max-w-[520px]"
        style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
      >
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`Erbil districts by ${legendLabel.toLowerCase()} across ${data.length} districts`}
        >
          {/* the ring roads, as orientation rather than decoration */}
          {[13, 25, 36].map((r) => (
            <circle
              key={r}
              cx={citadel.x}
              cy={citadel.y}
              r={r}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="0.35"
            />
          ))}

          <circle
            cx={citadel.x}
            cy={citadel.y}
            r="1"
            fill="var(--color-ink-400)"
          />
          <text
            x={citadel.x}
            y={citadel.y - 2.2}
            fontSize="2.4"
            textAnchor="middle"
            fill="var(--color-ink-400)"
          >
            Citadel
          </text>

          {districtPoints.map((point: DistrictPoint) => {
            const datum = byName.get(point.name);
            const { x, y } = projection(point);
            const isSelected = selected.includes(point.name);
            const isHover = hover === point.name;
            const r = datum ? radius(datum.outlets) : 2.4;

            return (
              <g
                key={point.name}
                role="button"
                tabIndex={0}
                aria-label={
                  datum
                    ? `${point.name}: ${formatValue(datum.value)} ${legendLabel.toLowerCase()} across ${datum.outlets} outlets`
                    : `${point.name}: no outlets in the current selection`
                }
                className="cursor-pointer"
                onMouseEnter={() => setHover(point.name)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(point.name)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(point.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(point.name);
                  }
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={datum ? rampStep(datum.value, breaks) : NO_DATA}
                  fillOpacity={datum ? 1 : 0.5}
                  stroke="#fff"
                  strokeWidth="0.6"
                />
                {(isSelected || isHover) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 1.4}
                    fill="none"
                    stroke="var(--color-violet)"
                    strokeWidth="0.6"
                  />
                )}
                {/* a hovered or selected district always shows its name,
                    even where the layout had to drop it */}
                {(labels.get(point.name) !== "none" || isHover || isSelected) && (
                  <text
                    x={x}
                    y={
                      labels.get(point.name) === "above"
                        ? y - r - 1.4
                        : y + r + 2.6
                    }
                    fontSize="2.2"
                    textAnchor="middle"
                    fill={
                      isSelected || isHover
                        ? "var(--color-ink-900)"
                        : "var(--color-ink-500)"
                    }
                    fontWeight={isSelected || isHover ? 600 : 400}
                    style={
                      isHover || isSelected
                        ? { paintOrder: "stroke", stroke: "#fff", strokeWidth: 0.9 }
                        : undefined
                    }
                  >
                    {point.name.replace(" / Qaysari", "")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        {/* read-out slot, fixed height so the map never shifts */}
        <div className="min-h-[112px] rounded-[12px] border border-line p-3">
          {active ? (
            <>
              <div className="t-h3 !text-[15px]">{active.name}</div>
              <dl className="mt-2 space-y-1 text-[12px]">
                <Row label="Outlets" value={`${active.outlets}`} />
                {active.rows.map((row) => (
                  <Row
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    tone={row.tone}
                  />
                ))}
              </dl>
            </>
          ) : (
            <p className="text-[12px] text-ink-400">
              Hover a district for its numbers. Click to filter the page to it.
            </p>
          )}
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {legendLabel}
          </div>
          <div className="mt-1.5 flex items-center gap-[3px]">
            {GAP_RAMP.map((colour) => (
              <span
                key={colour}
                className="h-[12px] flex-1 rounded-[2px]"
                style={{ background: colour }}
              />
            ))}
          </div>
          <div className="mono mt-1 flex justify-between text-[11px] text-ink-400">
            <span>{formatValue(breaks[0])}</span>
            <span>{formatValue(breaks[2])}+</span>
          </div>
          <p className="mt-2 text-[11px] text-ink-400">
            Circle size is outlets audited. Positions are district
            centroids, not boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical";
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className="mono font-semibold"
        style={{
          color:
            tone === "critical"
              ? "var(--color-critical)"
              : "var(--color-ink-900)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
