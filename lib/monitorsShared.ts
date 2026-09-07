/* ============================================================
   Monitors — shared shape between the API routes and the client.

   Priorities tracks the work someone decided to do. This tracks
   whether it worked: one metric, one segment, an optional target, and
   a reading recorded once per field visit.

   Pure and secret-free, so it is safe in a route handler and in a
   "use client" component alike.
   ============================================================ */

export const MONITORS_FIELD = {
  label: "Label",
  metric: "Metric",
  segmentType: "Segment Type",
  segment: "Segment",
  filters: "Filters",
  baseline: "Baseline",
  target: "Target",
  targetDate: "Target Date",
  readings: "Readings",
  owner: "Owner",
  status: "Status",
} as const;

export type MonitorMetric =
  | "shelf-share"
  | "availability"
  | "distribution"
  | "compliance"
  | "gaps";

export type SegmentType = "area" | "channel" | "sku" | "outlet" | "panel";
export type MonitorStatus = "Watching" | "Closed";

/* Which way is better is a property of the metric, stored rather than
   inferred at read time. Falling gaps is an improvement; falling share
   is not, and a page that gets that backwards once is a page nobody
   trusts again. */
export const METRIC_META: Record<
  MonitorMetric,
  { label: string; unit: string; goodDirection: "up" | "down"; decimals: number }
> = {
  "shelf-share": { label: "Shelf share", unit: "%", goodDirection: "up", decimals: 1 },
  availability: { label: "On-shelf availability", unit: "%", goodDirection: "up", decimals: 1 },
  distribution: { label: "Distribution", unit: "%", goodDirection: "up", decimals: 1 },
  compliance: { label: "Price compliance", unit: "%", goodDirection: "up", decimals: 1 },
  gaps: { label: "Open gaps", unit: "", goodDirection: "down", decimals: 0 },
};

export const MONITOR_METRICS = Object.keys(METRIC_META) as MonitorMetric[];

export type Reading = {
  /* The field visit this value describes — not the day it was
     recorded. A reading written late is still correct for its visit,
     because it is computed from that visit's data. */
  visit: string;
  value: number;
  at: string;
};

export type MonitorRecord = {
  id: string;
  label: string;
  metric: MonitorMetric;
  segmentType: SegmentType;
  segment: string;
  filters: Record<string, string[]>;
  baseline: number;
  target?: number;
  targetDate?: string;
  readings: Reading[];
  owner: string;
  status: MonitorStatus;
  createdAt: string;
};

type RawRecord = { id: string; createdTime: string; fields?: Record<string, unknown> };

export function hasLabel(record: RawRecord): boolean {
  const v = record.fields?.[MONITORS_FIELD.label];
  return typeof v === "string" && v.trim().length > 0;
}

/* Defensive by design: these fields are hand-editable in Airtable, so
   malformed content is a question of when, not if. Bad JSON degrades
   to an empty series rather than taking the page down. */
export function parseReadings(raw: unknown): Reading[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is Record<string, unknown> =>
          !!r && typeof r === "object" && typeof r.visit === "string" &&
          typeof r.value === "number" && Number.isFinite(r.value)
      )
      .map((r) => ({
        visit: r.visit as string,
        value: r.value as number,
        at: typeof r.at === "string" ? r.at : "",
      }))
      .sort((a, b) => a.visit.localeCompare(b.visit));
  } catch {
    return [];
  }
}

function parseFilters(raw: unknown): Record<string, string[]> {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, string[]>)
      : {};
  } catch {
    return {};
  }
}

export function toMonitor(record: RawRecord): MonitorRecord {
  const f = record.fields ?? {};
  const metric = f[MONITORS_FIELD.metric];
  const status = f[MONITORS_FIELD.status];
  return {
    id: record.id,
    label: (f[MONITORS_FIELD.label] as string) ?? "",
    metric: MONITOR_METRICS.includes(metric as MonitorMetric)
      ? (metric as MonitorMetric)
      : "shelf-share",
    segmentType: (f[MONITORS_FIELD.segmentType] as SegmentType) ?? "panel",
    segment: (f[MONITORS_FIELD.segment] as string) ?? "",
    filters: parseFilters(f[MONITORS_FIELD.filters]),
    baseline: Number(f[MONITORS_FIELD.baseline] ?? 0),
    target:
      f[MONITORS_FIELD.target] === undefined || f[MONITORS_FIELD.target] === null
        ? undefined
        : Number(f[MONITORS_FIELD.target]),
    targetDate: (f[MONITORS_FIELD.targetDate] as string) || undefined,
    readings: parseReadings(f[MONITORS_FIELD.readings]),
    owner: (f[MONITORS_FIELD.owner] as string) ?? "",
    status: status === "Closed" ? "Closed" : "Watching",
    createdAt: record.createdTime,
  };
}

export function serialiseReadings(readings: Reading[]): string {
  return readings.length ? JSON.stringify(readings) : "";
}

/* ---------- judgement ----------

   Three states, computed rather than felt. Absent a target the card
   makes no claim about whether the movement is good — that is the
   reader's job, and pretending otherwise would be inventing a
   standard nobody set. */
export type TrackState = "on-track" | "off-track" | "watching";

export function trackStateOf(m: MonitorRecord, today = new Date()): TrackState {
  const latest = m.readings[m.readings.length - 1];
  if (m.target === undefined || !latest || m.readings.length < 2) return "watching";

  const better = METRIC_META[m.metric].goodDirection === "up";
  const reached = better ? latest.value >= m.target : latest.value <= m.target;
  if (reached) return "on-track";

  const movedToward = better
    ? latest.value > m.baseline
    : latest.value < m.baseline;
  if (!movedToward) return "off-track";

  /* Moving the right way, but is it fast enough? Against a straight
     line from baseline to target over the time allowed. */
  if (!m.targetDate) return "on-track";
  const start = Date.parse(m.createdAt);
  const end = Date.parse(m.targetDate);
  const now = today.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return "on-track";
  }
  const elapsed = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const expected = m.baseline + (m.target - m.baseline) * elapsed;
  const ahead = better ? latest.value >= expected : latest.value <= expected;
  return ahead ? "on-track" : "off-track";
}

export function formatValue(value: number, metric: MonitorMetric): string {
  const meta = METRIC_META[metric];
  return `${value.toFixed(meta.decimals)}${meta.unit}`;
}

/* Signed movement, phrased so that "better" is always positive
   regardless of which way the metric runs. */
export function improvementOf(m: MonitorRecord): number | null {
  const latest = m.readings[m.readings.length - 1];
  if (!latest) return null;
  const raw = latest.value - m.baseline;
  return METRIC_META[m.metric].goodDirection === "up" ? raw : -raw;
}
