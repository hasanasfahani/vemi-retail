"use client";

/* Pinning a number to the Watchlist.

   The control lives on the thing being watched — a chart row already
   IS a metric on a segment, which is exactly what a monitor holds, so
   there is no builder screen where you re-pick what the chart already
   knows.

   The sheet is deliberately the same gesture as the action sheet:
   deciding to fix something and deciding to verify it are siblings,
   and they should feel like it. */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { readAccessSnapshot } from "@/lib/demoAccess";
import {
  METRIC_META,
  formatValue,
  type MonitorMetric,
  type SegmentType,
} from "@/lib/monitorsShared";

const noopSubscribe = () => () => {};

export type WatchTarget = {
  metric: MonitorMetric;
  segmentType: SegmentType;
  segment: string;
  label: string;
  currentValue: number;
  visit: string;
  filters?: Record<string, string[]>;
  /* A defensible target to offer — the citywide average for a
     district, the panel average for a channel. Pre-filling one honest
     suggestion beats asking someone to invent a number. */
  suggestedTarget?: { value: number; why: string };
};

export default function WatchButton({
  target,
  className = "",
  label = "Watch",
}: {
  target: WatchTarget;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={done}
        className={className || "text-[11.5px] font-semibold text-violet-ink hover:underline disabled:text-ink-400 disabled:no-underline"}
      >
        {done ? "Watching ✓" : label}
      </button>
      {open && (
        <WatchSheet
          target={target}
          onClose={() => setOpen(false)}
          onDone={() => {
            setDone(true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function WatchSheet({
  target,
  onClose,
  onDone,
}: {
  target: WatchTarget;
  onClose: () => void;
  onDone: () => void;
}) {
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);
  const [owner, setOwner] = useState(session?.fullName ?? "");
  const [useTarget, setUseTarget] = useState(!!target.suggestedTarget);
  const [targetValue, setTargetValue] = useState(
    target.suggestedTarget ? String(target.suggestedTarget.value) : ""
  );
  const [targetDate, setTargetDate] = useState(twoCyclesOut());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const meta = METRIC_META[target.metric];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: target.label,
          metric: target.metric,
          segmentType: target.segmentType,
          segment: target.segment,
          filters: target.filters ?? {},
          baseline: target.currentValue,
          visit: target.visit,
          owner: owner.trim(),
          target: useTarget && targetValue ? Number(targetValue) : null,
          targetDate: useTarget ? targetDate : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error("failed");
      onDone();
    } catch {
      setError("Couldn't save that. Your input is still here — try again.");
      setSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/25 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Watch ${target.label}`}
        className="w-full max-w-[440px] overflow-hidden rounded-t-[18px] border border-line bg-white sm:rounded-[18px]"
      >
        <div className="border-b border-line px-5 pb-4 pt-5">
          <h2 className="t-h3 !text-[16px] leading-snug">Watch {target.label}</h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Records{" "}
            <span className="mono font-semibold text-ink-900">
              {formatValue(target.currentValue, target.metric)}
            </span>{" "}
            as the baseline, then a reading every visit from here.
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="flex flex-col gap-4 px-5 py-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Owner
              </span>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Who's accountable"
                className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13.5px] text-ink-900 outline-none focus:border-violet"
              />
            </label>

            <div className="rounded-[10px] border border-line p-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink-900">
                <input
                  type="checkbox"
                  checked={useTarget}
                  onChange={(e) => setUseTarget(e.target.checked)}
                  className="h-[14px] w-[14px] accent-[var(--color-violet)]"
                />
                Set a target
              </label>
              <p className="mt-1 text-[11.5px] text-ink-400">
                Without one this just tracks movement — the page won&apos;t
                judge whether it&apos;s good.
              </p>

              {useTarget && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      Target ({meta.unit || "count"})
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13.5px] text-ink-900 outline-none focus:border-violet"
                    />
                    {target.suggestedTarget && (
                      <span className="text-[11px] text-ink-400">
                        {target.suggestedTarget.why}
                      </span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      By
                    </span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13.5px] text-ink-900 outline-none focus:border-violet"
                    />
                    <span className="text-[11px] text-ink-400">
                      Two visits out by default.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[12.5px] font-medium" style={{ color: "var(--color-critical)" }}>
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-medium text-ink-500 hover:text-ink-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!owner.trim() || saving}
              className="rounded-[8px] bg-violet px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-violet-ink disabled:bg-line-strong disabled:text-ink-400"
            >
              {saving ? "Adding…" : "Add to Watchlist"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* Two audit cycles out — long enough that a fix has been through the
   shelf twice, which is what it takes to believe it held. */
function twoCyclesOut() {
  const d = new Date();
  d.setDate(d.getDate() + 56);
  return d.toISOString().slice(0, 10);
}
