/* Building the thing a Watch control pins.

   One helper per shape, shared by every surface that draws that shape,
   so a district watched from Command Center and the same district
   watched from Shelf produce identical monitors — same metric, same
   segment, same suggested target. Three pages each inventing their own
   would be three ways to disagree.

   The suggested target is always a figure already on the page: a
   district is asked to reach the citywide average, a channel the panel
   average. Pre-filling one defensible number beats asking someone to
   invent one. */

import { clientBrand } from "./portalData";
import { METRIC_META, type MonitorMetric } from "./monitorsShared";
import type { WatchTarget } from "@/components/portal/WatchButton";

export function districtWatchTarget(args: {
  area: string;
  /* The district's own share, in points. */
  value: number;
  cityAverage: number;
  visit: string;
}): WatchTarget {
  return {
    metric: "shelf-share",
    segmentType: "area",
    segment: args.area,
    label: `${clientBrand.name} shelf share · ${args.area}`,
    currentValue: args.value,
    visit: args.visit,
    filters: { areas: [args.area] },
    suggestedTarget: {
      value: args.cityAverage,
      why: `Your citywide average, ${args.cityAverage}%.`,
    },
  };
}

export function channelWatchTarget(args: {
  channel: string;
  value: number;
  overallAverage: number;
  visit: string;
}): WatchTarget {
  return {
    metric: "availability",
    segmentType: "channel",
    segment: args.channel,
    label: `${clientBrand.name} availability · ${args.channel}`,
    currentValue: args.value,
    visit: args.visit,
    filters: { channels: [args.channel] },
    suggestedTarget: {
      value: args.overallAverage,
      why: `Your overall availability, ${args.overallAverage}%.`,
    },
  };
}

/* Any brand, not just yours — a rival taking your space is exactly
   the thing worth watching, so the segment names the brand and
   computeMetric measures that brand rather than defaulting to the
   client. */
export function brandShareWatchTarget(args: {
  brandId: string;
  brandLabel: string;
  value: number;
  visit: string;
}): WatchTarget {
  return {
    metric: "shelf-share",
    segmentType: "brand",
    segment: args.brandId,
    label: `${args.brandLabel} shelf share · citywide`,
    currentValue: args.value,
    visit: args.visit,
  };
}

export function outletGapsWatchTarget(args: {
  posId: string;
  code: string;
  value: number;
  visit: string;
}): WatchTarget {
  return {
    metric: "gaps",
    segmentType: "outlet",
    segment: args.posId,
    label: `Open gaps · ${args.code}`,
    currentValue: args.value,
    visit: args.visit,
    /* Zero is the only defensible target for a gap count, and it is
       not an invented number — it is the definition of the shelf being
       right. */
    suggestedTarget: { value: 0, why: "No gaps — the shelf as it should be." },
  };
}

export function outletComplianceWatchTarget(args: {
  posId: string;
  code: string;
  value: number;
  visit: string;
}): WatchTarget {
  return {
    metric: "compliance",
    segmentType: "outlet",
    segment: args.posId,
    label: `Price compliance · ${args.code}`,
    currentValue: args.value,
    visit: args.visit,
    suggestedTarget: { value: 100, why: "Every line within RRP ±5%." },
  };
}

/* A headline tile, watched under whatever filters are applied.

   The slice matters as much as the metric: "availability" watched from
   an unfiltered page and from a page narrowed to Mini-markets are two
   different monitors, and the label has to say which so the Watchlist
   never shows two cards a reader cannot tell apart. Filters are stored
   alongside, so computeMetric reproduces the exact slice on every
   later reading. */
export function kpiWatchTarget(args: {
  metric: MonitorMetric;
  value: number;
  visit: string;
  filters?: { areas?: string[]; channels?: string[]; brands?: string[] };
  suggestedTarget?: { value: number; why: string };
}): WatchTarget {
  const areas = args.filters?.areas ?? [];
  const channels = args.filters?.channels ?? [];

  /* A single area or channel is a real segment the engine can narrow
     to directly. Anything else — several districts, a mix, or nothing
     — is the panel with filters attached. */
  const segmentType: WatchTarget["segmentType"] =
    areas.length === 1 && !channels.length
      ? "area"
      : channels.length === 1 && !areas.length
        ? "channel"
        : "panel";
  const segment =
    segmentType === "area" ? areas[0] : segmentType === "channel" ? channels[0] : "";

  const where =
    [...areas, ...channels].length === 0
      ? "citywide"
      : [...areas, ...channels].join(", ");

  const stored: Record<string, string[]> = {};
  if (areas.length) stored.areas = areas;
  if (channels.length) stored.channels = channels;
  if (args.filters?.brands?.length) stored.brands = args.filters.brands;

  return {
    metric: args.metric,
    segmentType,
    segment,
    label: `${clientBrand.name} ${METRIC_META[args.metric].label.toLowerCase()} · ${where}`,
    currentValue: args.value,
    visit: args.visit,
    filters: stored,
    suggestedTarget: args.suggestedTarget,
  };
}
