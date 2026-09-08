/* ============================================================
   FIELD OPS — turning findings into a rep's day.

   Every other surface in this product answers "what is wrong" or
   "what do I decide". This one answers a question neither of them
   touches: in what ORDER does one person, in one van, actually work
   the list.

   That is a different problem from ranking. The out-of-stock page
   sorts outlets by what their gaps cost, which is the right order to
   read and the wrong order to drive — the two most expensive stops in
   Erbil can sit at opposite ends of the city, and a day spent
   crossing it twice closes fewer gaps than a day spent working one
   quadrant. So this file does the ranking AND then re-orders the
   chosen stops geographically, and keeps those two steps separate and
   named, because collapsing them is exactly the mistake.

   Geography resolves to DISTRICT centroids, not outlet addresses: the
   audit records which district a store is in and nothing finer. The
   route is therefore a district order with the stops inside each
   district grouped together — honest about its resolution, and still
   the difference between one loop and three.
   ============================================================ */

import { districtPoints, ERBIL_CITADEL, type DistrictPoint } from "./portal";
import { clientBrand, posOf, skuOf, type OosRow } from "./portalData";
import type { FilteredView } from "./portalFilters";

export type Stop = {
  posId: string;
  code: string;
  name?: string;
  area: string;
  channel: string;
  /* The CLIENT's open gaps at this outlet, worst first — scoped
     deliberately, not incidentally. An earlier cut kept every brand's
     gaps here and counted `worst` across all of them, so the pick list
     advertised ERB-903 as "longest 35d" while the call sheet for the
     same store listed nothing older than 20 days. The 35-day gap was a
     rival's. Two panels disagreeing about one outlet is worse than
     either being wrong on its own, and the fix is that this page has
     exactly one subject: the run this brand's rep is being sent on. */
  gaps: OosRow[];
  /* Gaps to close at this stop — the reason a rep is sent. */
  mine: number;
  /* Shelf space × time, the same currency the rest of the product
     ranks by, so a stop's worth here matches its worth everywhere. */
  lostFacingDays: number;
  /* Longest-running gap, in days. */
  worst: number;
  /* Gaps that were also open at the previous visit. A stop with these
     is not a delivery that slipped; it is an account nobody is
     working. */
  persistent: number;
  clientAvailability: number;
};

/* ---------- step 1: what a stop is worth ---------- */

export function buildStops(view: FilteredView): Stop[] {
  const byPos = new Map<string, OosRow[]>();
  for (const row of view.oosRows) {
    byPos.set(row.posId, [...(byPos.get(row.posId) ?? []), row]);
  }

  const availability = new Map(
    view.byPos.map((p) => [p.posId, p.clientAvailability])
  );

  return [...byPos.entries()]
    .map(([posId, rows]) => {
      const outlet = posOf(posId)!;
      const gaps = rows
        .filter((g) => skuOf(g.skuId)?.brandId === clientBrand.id)
        .sort((a, b) => b.lostFacingDays - a.lostFacingDays);
      return {
        posId,
        code: outlet.code,
        name: outlet.name,
        area: outlet.area,
        channel: outlet.channel,
        gaps,
        mine: gaps.length,
        lostFacingDays: gaps.reduce((s, g) => s + g.lostFacingDays, 0),
        worst: gaps.length ? Math.max(...gaps.map((g) => g.daysOut)) : 0,
        persistent: gaps.filter((g) => g.persistent).length,
        clientAvailability: availability.get(posId) ?? 0,
      };
    })
    /* Only outlets where the client is actually missing something.
       A store full of rival gaps is not a stop on this brand's run. */
    .filter((s) => s.mine > 0)
    .sort((a, b) => b.lostFacingDays - a.lostFacingDays);
}

/* ---------- step 2: what order to drive them ---------- */

const POINTS = new Map(districtPoints.map((p) => [p.name, p]));

export function haversineKm(a: DistrictPoint, b: DistrictPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/* ---------- step 1b: which stops make the day ----------

   The two strategies exist because the honest answer to "which eight
   outlets" depends on what is scarce. Ranked purely by value, the top
   eight in Erbil land in eight different districts and the day becomes
   a 33km tour — every stop is the best available, and the day closes
   fewer gaps than a worse-ranked but tighter one would. Ranked purely
   by proximity you work a cheap corner of the city very efficiently.

   Neither is correct in general, so the page offers both and says what
   each costs. What it does NOT do is pick one and present it as the
   answer. */
export type PickStrategy = "value" | "tight";

export function pickStops(
  stops: Stop[],
  count: number,
  strategy: PickStrategy
): Stop[] {
  if (strategy === "value") return stops.slice(0, count);

  const byArea = new Map<string, Stop[]>();
  for (const stop of stops) {
    byArea.set(stop.area, [...(byArea.get(stop.area) ?? []), stop]);
  }

  /* Seed on the richest district rather than the nearest one: a tight
     loop around the cheapest corner of the city is efficient and
     pointless. Then walk outward by proximity. */
  const areas = [...byArea.entries()]
    .map(([area, list]) => ({
      area,
      value: list.reduce((s, x) => s + x.lostFacingDays, 0),
    }))
    .sort((a, b) => b.value - a.value);
  if (!areas.length) return [];

  const order: string[] = [areas[0].area];
  const left = areas.slice(1).map((a) => a.area);
  while (left.length) {
    const from = POINTS.get(order[order.length - 1]);
    if (!from) {
      order.push(...left.splice(0));
      break;
    }
    let best = 0;
    let bestKm = Infinity;
    left.forEach((area, i) => {
      const point = POINTS.get(area);
      const d = point ? haversineKm(from, point) : Infinity;
      if (d < bestKm) {
        bestKm = d;
        best = i;
      }
    });
    order.push(left.splice(best, 1)[0]);
  }

  const out: Stop[] = [];
  for (const area of order) {
    for (const stop of byArea.get(area)!) {
      if (out.length >= count) return out;
      out.push(stop);
    }
  }
  return out;
}

export type Route = {
  /* Stops in travel order, grouped by district. */
  stops: Stop[];
  /* Districts in the order they are worked, with their leg distance. */
  legs: { area: string; stops: number; km: number }[];
  /* Straight-line kilometres between district centroids, out and back.
     Deliberately not called "drive distance" — Erbil's ring roads mean
     the van covers more, and a figure dressed up as a driving estimate
     would be the kind of false precision this product avoids. */
  km: number;
  lostFacingDays: number;
  gaps: number;
};

/* Nearest-neighbour from the Citadel. Not optimal — travelling
   salesman never is at this price — but it reliably turns a value-
   ranked list into one loop instead of a zigzag, which is the whole
   benefit. Districts with no centroid on file sort to the end rather
   than silently landing on the map's origin. */
export function orderRoute(selected: Stop[]): Route {
  const byArea = new Map<string, Stop[]>();
  for (const stop of selected) {
    byArea.set(stop.area, [...(byArea.get(stop.area) ?? []), stop]);
  }

  const remaining = [...byArea.keys()];
  const known = remaining.filter((a) => POINTS.has(a));
  const unknown = remaining.filter((a) => !POINTS.has(a));

  const legs: Route["legs"] = [];
  let here: DistrictPoint = {
    name: "Citadel",
    lat: ERBIL_CITADEL.lat,
    lng: ERBIL_CITADEL.lng,
  };
  let km = 0;

  while (known.length) {
    let best = 0;
    let bestKm = Infinity;
    known.forEach((area, i) => {
      const d = haversineKm(here, POINTS.get(area)!);
      if (d < bestKm) {
        bestKm = d;
        best = i;
      }
    });
    const area = known.splice(best, 1)[0];
    km += bestKm;
    here = POINTS.get(area)!;
    legs.push({
      area,
      stops: byArea.get(area)!.length,
      km: Math.round(bestKm * 10) / 10,
    });
  }

  for (const area of unknown) {
    legs.push({ area, stops: byArea.get(area)!.length, km: 0 });
  }

  /* Home again — a day that ends across the city is not a day that
     ends. */
  km += haversineKm(here, {
    name: "Citadel",
    lat: ERBIL_CITADEL.lat,
    lng: ERBIL_CITADEL.lng,
  });

  const stops = legs.flatMap((leg) =>
    [...byArea.get(leg.area)!].sort(
      (a, b) => b.lostFacingDays - a.lostFacingDays
    )
  );

  return {
    stops,
    legs,
    km: Math.round(km * 10) / 10,
    lostFacingDays: stops.reduce((s, x) => s + x.lostFacingDays, 0),
    gaps: stops.reduce((s, x) => s + x.mine, 0),
  };
}
