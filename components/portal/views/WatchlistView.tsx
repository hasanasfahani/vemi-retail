"use client";

/* The Watchlist.

   Priorities tracks the work someone decided to do. This tracks
   whether it worked — one number, one slice, watched across visits.

   Readings accrue with no scheduler: opening this page recomputes each
   monitor against the current visit and records a reading if that
   visit has none yet. The server rejects a duplicate visit, so opening
   the page twice does nothing the second time. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/portal/PageHeader";
import { latest } from "@/lib/portalData";
import {
  METRIC_META,
  formatValue,
  improvementOf,
  trackStateOf,
  type MonitorRecord,
  type TrackState,
} from "@/lib/monitorsShared";
import { computeMetric } from "@/lib/monitorValue";

const STATE_ORDER: Record<TrackState, number> = {
  "off-track": 0,
  watching: 1,
  "on-track": 2,
};

export default function WatchlistView() {
  const [monitors, setMonitors] = useState<MonitorRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/monitors", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error("failed");
      return data.monitors as MonitorRecord[];
    } catch {
      setError("Could not reach the watchlist. Try again in a moment.");
      return null;
    }
  }, []);

  /* Load, then top up any monitor missing a reading for the current
     visit. Sequential rather than parallel: these are writes against a
     shared table, and a burst of them buys nothing on a list this
     size. */
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      const list = await load();
      if (cancelled || !list) return;
      setMonitors(list);

      const stale = list.filter(
        (m) =>
          m.status === "Watching" &&
          !m.readings.some((r) => r.visit === latest.visit)
      );
      if (!stale.length) return;

      setRecording(true);
      for (const m of stale) {
        const value = computeMetric(
          {
            metric: m.metric,
            segmentType: m.segmentType,
            segment: m.segment,
            filters: m.filters as never,
          },
          latest
        );
        if (value === null) continue;
        try {
          await fetch(`/api/monitors/${encodeURIComponent(m.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reading: { visit: latest.visit, value } }),
          });
        } catch {
          /* A reading that fails to append is retried next open — the
             visit key makes that safe. */
        }
      }
      if (cancelled) return;
      const refreshed = await load();
      if (!cancelled && refreshed) setMonitors(refreshed);
      setRecording(false);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [load]);

  const close = async (id: string) => {
    await fetch(`/api/monitors/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Closed" }),
    });
    const refreshed = await load();
    if (refreshed) setMonitors(refreshed);
  };

  const { watching, closed } = useMemo(() => {
    const all = monitors ?? [];
    return {
      watching: all
        .filter((m) => m.status === "Watching")
        .sort(
          (a, b) =>
            STATE_ORDER[trackStateOf(a)] - STATE_ORDER[trackStateOf(b)] ||
            a.label.localeCompare(b.label)
        ),
      closed: all.filter((m) => m.status === "Closed"),
    };
  }, [monitors]);

  return (
    <>
      <PageHeader title="Watchlist" lead="Numbers you've decided to be accountable for" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Pin any bar on any chart with <strong className="text-ink-700">Watch</strong>.
          A reading is recorded every visit — {recording ? "recording this visit now…" : "automatically, when this page opens."}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[14px] border border-line bg-white p-4">
          <p className="text-sm text-ink-700">{error}</p>
        </div>
      )}

      {monitors === null && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[18px] border border-line bg-white p-5">
              <div className="sk-line" style={{ width: 160, height: 14 }} />
              <div className="sk-block mt-4" style={{ height: 80 }} />
            </div>
          ))}
        </div>
      )}

      {monitors && watching.length === 0 && (
        <div className="rounded-[18px] border border-line bg-white p-8 text-center">
          <p className="text-sm text-ink-500">
            Nothing on the watchlist yet.
          </p>
          <p className="mt-1 text-[13px] text-ink-400">
            Open{" "}
            <Link href="/dashboard/shelf" className="font-semibold text-violet-ink hover:underline">
              Shelf
            </Link>{" "}
            and hit Watch on any district or SKU to start tracking it.
          </p>
        </div>
      )}

      {watching.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {watching.map((m) => (
            <MonitorCard key={m.id} monitor={m} onClose={() => close(m.id)} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <details className="group mt-6">
          <summary className="cursor-pointer list-none text-[13px] font-medium text-ink-400 hover:text-ink-700">
            {closed.length} no longer watching
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {closed.map((m) => (
              <MonitorCard key={m.id} monitor={m} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

function MonitorCard({
  monitor,
  onClose,
}: {
  monitor: MonitorRecord;
  onClose?: () => void;
}) {
  const meta = METRIC_META[monitor.metric];
  const state = trackStateOf(monitor);
  const latestReading = monitor.readings[monitor.readings.length - 1];
  const improvement = improvementOf(monitor);
  const firstOnly = monitor.readings.length < 2;

  return (
    <section className="rounded-[18px] border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="t-h3 !text-[14.5px] leading-snug">{monitor.label}</h2>
          <p className="mt-0.5 text-[12px] text-ink-400">
            Watching since {monitor.createdAt.slice(0, 10)}
            {monitor.owner ? ` · ${monitor.owner}` : ""}
          </p>
        </div>
        <StatePill state={state} />
      </div>

      <div className="mt-3 flex items-end gap-3">
        <span className="font-display text-[30px] font-bold leading-none tracking-[-0.03em] text-ink-900">
          {latestReading ? formatValue(latestReading.value, monitor.metric) : "—"}
        </span>
        {!firstOnly && improvement !== null && (
          <span
            className="mono pb-1 text-[12.5px] font-semibold"
            style={{
              color:
                Math.abs(improvement) < 0.05
                  ? "var(--color-ink-400)"
                  : improvement > 0
                    ? "var(--color-good)"
                    : "var(--color-critical)",
            }}
          >
            {improvement > 0 ? "+" : ""}
            {improvement.toFixed(meta.decimals)} since baseline
          </span>
        )}
      </div>

      {/* A single reading is the honest state of a new monitor, not a
          broken chart — so say so, and show the movement that happened
          before watching began as clearly-labelled context. */}
      {firstOnly ? (
        <p className="mt-2 text-[12.5px] text-ink-400">
          First reading — the line starts here. Movement before you began
          watching isn&apos;t part of this record.
        </p>
      ) : (
        <Sparkline monitor={monitor} />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-[12px]">
        {monitor.target !== undefined ? (
          <span className="text-ink-500">
            Target{" "}
            <span className="mono font-semibold text-ink-900">
              {formatValue(monitor.target, monitor.metric)}
            </span>
            {monitor.targetDate ? ` by ${monitor.targetDate}` : ""}
            {latestReading && (
              <span className="mono text-ink-400">
                {" "}
                · {Math.abs(monitor.target - latestReading.value).toFixed(meta.decimals)}
                {meta.unit} to go
              </span>
            )}
          </span>
        ) : (
          <span className="text-ink-400">No target — tracking movement only</span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-medium text-ink-400 hover:text-ink-700"
          >
            Stop watching
          </button>
        )}
      </div>
    </section>
  );
}

/* Two or more readings earn a line. Baseline and target are drawn as
   hairlines so "where I started" and "where I'm going" are visible
   without a legend. */
function Sparkline({ monitor }: { monitor: MonitorRecord }) {
  const values = monitor.readings.map((r) => r.value);
  const marks = [...values, monitor.baseline];
  if (monitor.target !== undefined) marks.push(monitor.target);
  const min = Math.min(...marks);
  const max = Math.max(...marks);
  const span = max - min || 1;
  const w = 260;
  const h = 44;
  const x = (i: number) =>
    monitor.readings.length === 1
      ? w / 2
      : (i / (monitor.readings.length - 1)) * (w - 8) + 4;
  const y = (v: number) => h - 6 - ((v - min) / span) * (h - 14);

  const path = monitor.readings
    .map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`)
    .join(" ");

  return (
    <div className="mt-2.5 overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[44px] w-full min-w-[220px]" role="img"
        aria-label={`${monitor.readings.length} readings from ${formatValue(monitor.readings[0].value, monitor.metric)} to ${formatValue(values[values.length - 1], monitor.metric)}`}>
        <line x1="0" y1={y(monitor.baseline)} x2={w} y2={y(monitor.baseline)}
          stroke="var(--color-line-strong)" strokeWidth="1" />
        {monitor.target !== undefined && (
          <line x1="0" y1={y(monitor.target)} x2={w} y2={y(monitor.target)}
            stroke="var(--color-ink-900)" strokeWidth="1" />
        )}
        <path d={path} fill="none" stroke="var(--color-violet)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
        {monitor.readings.map((r, i) => (
          <circle key={r.visit + i} cx={x(i)} cy={y(r.value)} r="3"
            fill={i === monitor.readings.length - 1 ? "var(--color-violet)" : "var(--color-paper)"}
            stroke="var(--color-violet)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

function StatePill({ state }: { state: TrackState }) {
  if (state === "watching") {
    return (
      <span className="pill shrink-0" style={{ background: "var(--color-canvas)", color: "var(--color-ink-500)" }}>
        Watching
      </span>
    );
  }
  return (
    <span className={`pill shrink-0 ${state === "on-track" ? "pill-good" : "pill-critical"}`}>
      {state === "on-track" ? "On track" : "Off track"}
    </span>
  );
}
