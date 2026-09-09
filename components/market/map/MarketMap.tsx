"use client";

/* THE MAP, behind one door.

   Leaflet and its cluster plugin are imported here and nowhere else,
   and nothing above this file knows either exists: a page hands over
   points, a metric and a click handler. Swapping OpenStreetMap tiles
   for Mapbox, or Leaflet for something else entirely, is a change to
   this file alone.

   Leaflet touches `window` on import, so the module is loaded lazily
   inside an effect rather than at the top of the file — a static
   import would break the prerender of every page that draws a map.

   Marker colour carries execution state, and the four states are the
   same four the pills and the table use: one decision about what
   "needs attention" means, made in health.ts and read here. */

import { useEffect, useMemo, useRef, useState } from "react";
import { BAND_COLOR, BAND_LABEL, type Band } from "../ui/health";

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  band: Band;
  meta?: string;
  /* Aggregate points — a district rather than an outlet — carry their
     own size and colour: size says how much evidence sits under the
     bubble, colour says which brand leads it, and neither is a health
     band. When these are given the band is used only as a fallback. */
  radius?: number;
  color?: string;
};

export default function MarketMap({
  points,
  onSelect,
  height = 420,
  unit = "",
  center,
  zoom,
  cluster = true,
}: {
  points: MapPoint[];
  onSelect?: (id: string) => void;
  height?: number;
  unit?: string;
  center?: [number, number];
  zoom?: number;
  /* Outlets cluster; aggregates do not. A bubble that already stands
     for twelve outlets must not be merged into a bubble standing for
     forty — the reader would have no idea what the number meant. */
  cluster?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layer = useRef<import("leaflet").LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  /* Iraq, framed so all six cities sit in view at first paint. */
  const view = useMemo<{ center: [number, number]; zoom: number }>(
    () => ({ center: center ?? [33.2, 43.9], zoom: zoom ?? 6 }),
    [center, zoom]
  );

  useEffect(() => {
    let live = true;
    let created: import("leaflet").Map | null = null;
    let observer: ResizeObserver | null = null;
    let settle: number | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (!live || !host.current || map.current) return;

      created = L.map(host.current, {
        center: view.center,
        zoom: view.zoom,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(created);
      map.current = created;
      setReady(true);

      /* Leaflet measures its container once, at construction. Inside a
         responsive grid that measurement is routinely taken before the
         layout settles, and the result is a map that paints a single
         square of tiles in the middle of a grey box — which is exactly
         what this did until the two lines below were added.

         So: re-measure immediately, again on a timer once layout has
         settled, and after that on every resize. Three belts, because
         each covers a case the others miss — the observer only fires
         when the size CHANGES, and the bad measurement happens before
         it starts watching, while a `requestAnimationFrame` never runs
         at all in a background tab, which is exactly where an
         automated check looks at the page. */
      created.invalidateSize();
      settle = window.setTimeout(() => created?.invalidateSize(), 120);
      observer = new ResizeObserver(() => created?.invalidateSize());
      observer.observe(host.current);
    })();

    return () => {
      live = false;
      observer?.disconnect();
      window.clearTimeout(settle);
      created?.remove();
      map.current = null;
      layer.current = null;
    };
    /* The frame is set once; changing it later would yank the map out
       from under a reader who had panned somewhere deliberately. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Points are redrawn whenever the filters change. The whole cluster
     layer is replaced rather than diffed: at a thousand markers the
     rebuild is imperceptible, and a diff would be a second source of
     truth about what is on the map. */
  useEffect(() => {
    if (!ready || !map.current) return;
    let live = true;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (!live || !map.current) return;

      layer.current?.remove();

      const group = cluster
        ? (
            L as unknown as {
              markerClusterGroup: (o: Record<string, unknown>) => import("leaflet").LayerGroup;
            }
          ).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 46,
        /* A cluster is coloured by the WORST state inside it. A bubble
           averaging four critical outlets into "average" would hide
           exactly what the reader opened the map to find. */
        iconCreateFunction: (c: { getAllChildMarkers: () => { options: { band?: Band } }[] }) => {
          const bands = c.getAllChildMarkers().map((m) => m.options.band ?? "average");
          const worst: Band = bands.includes("critical")
            ? "critical"
            : bands.includes("attention")
              ? "attention"
              : bands.includes("average")
                ? "average"
                : "strong";
          const n = bands.length;
          const size = n > 200 ? 46 : n > 50 ? 40 : n > 10 ? 34 : 28;
          return L.divIcon({
            html: `<span style="
              display:flex;align-items:center;justify-content:center;
              width:${size}px;height:${size}px;border-radius:999px;
              background:${BAND_COLOR[worst]};color:#fff;
              font:600 ${size > 34 ? 13 : 11.5}px/1 var(--font-body,system-ui);
              box-shadow:0 0 0 3px rgba(255,255,255,.85), 0 2px 8px rgba(20,21,26,.28);
            ">${n}</span>`,
            className: "vemi-cluster",
            iconSize: [size, size],
          });
        },
          })
        : L.layerGroup();

      for (const p of points) {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: p.radius ?? 6,
          weight: 2,
          color: "#ffffff",
          fillColor: p.color ?? BAND_COLOR[p.band],
          fillOpacity: p.color ? 0.85 : 1,
        }) as import("leaflet").CircleMarker & { options: { band?: Band } };
        marker.options.band = p.band;
        marker.bindTooltip(
          `<strong>${p.name}</strong><br>${p.color ? "" : `${BAND_LABEL[p.band]} · `}${p.value}${unit}${
            p.meta ? `<br>${p.meta}` : ""
          }`,
          { direction: "top", offset: [0, -6] }
        );
        if (onSelect) marker.on("click", () => onSelect(p.id));
        group.addLayer(marker);
      }

      group.addTo(map.current);
      layer.current = group;
    })();

    return () => {
      live = false;
    };
  }, [points, ready, onSelect, unit, cluster]);

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-line">
      <div ref={host} style={{ height }} className="z-0 w-full bg-canvas" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-ink-400">
          Loading map…
        </div>
      )}
    </div>
  );
}
