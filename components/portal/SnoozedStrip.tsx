"use client";

/* What the reader has parked, and what came back on its own.

   The non-negotiable rule of this feature: a snoozed finding is
   hidden, never secret. A count is always on the page, the list is
   always one click away, and every entry names who parked it and why.
   Hiding things with no way to enumerate them is how a queue quietly
   stops matching reality — the failure mode this control was supposed
   to fix, not cause.

   The woken half is the more important one. When something the reader
   deliberately parked has escalated back onto the list, saying so
   plainly is what makes the whole mechanism trustworthy: it proves the
   wake conditions are real rather than decorative. */

import { useState } from "react";
import { describeWake, type SnoozeRecord, type WakeReason } from "@/lib/snoozeShared";

export type ParkedEntry = {
  snoozeId: string;
  headline: string;
  reason: string;
  owner: string;
  snoozedAt: string;
  impactLabel: string;
  scopeLabel: string;
  /* Empty means it sleeps until it worsens rather than until a date. */
  untilVisit: string;
};

export type WokenEntry = {
  headline: string;
  owner: string;
  wake: WakeReason;
};

export default function SnoozedStrip({
  parked,
  woken,
}: {
  parked: ParkedEntry[];
  woken: WokenEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [waking, setWaking] = useState<string | null>(null);
  const [gone, setGone] = useState<string[]>([]);

  const visible = parked.filter((p) => !gone.includes(p.snoozeId));

  if (!visible.length && !woken.length) return null;

  const wake = async (snoozeId: string) => {
    setWaking(snoozeId);
    try {
      const res = await fetch(`/api/snoozes?id=${encodeURIComponent(snoozeId)}`, {
        method: "DELETE",
      });
      if (res.ok) setGone((g) => [...g, snoozeId]);
    } finally {
      setWaking(null);
    }
  };

  return (
    <section className="mt-4 rounded-[18px] border border-line bg-white px-5 py-4 sm:px-6">
      {woken.length > 0 && (
        <div className={visible.length ? "mb-3 border-b border-line pb-3" : undefined}>
          {woken.map((entry) => (
            <p
              key={entry.headline}
              className="flex items-start gap-2 text-[13px] leading-snug text-ink-900"
            >
              <span
                className="mt-[6px] inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: "var(--color-critical)" }}
                aria-hidden
              />
              <span>
                <strong className="font-semibold">{entry.headline}</strong> was
                parked by {entry.owner} and is {describeWake(entry.wake)}.
              </span>
            </p>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-ink-500">
              <span className="font-semibold text-ink-700">
                {visible.length} finding{visible.length === 1 ? "" : "s"} parked
              </span>{" "}
              — considered in this window and deliberately not actioned.
            </p>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="shrink-0 text-[12.5px] font-medium text-violet-ink hover:underline"
            >
              {open ? "Hide them" : "Show them"}
            </button>
          </div>

          {open && (
            <ul className="mt-3 flex flex-col gap-2.5">
              {visible.map((entry) => (
                <li
                  key={entry.snoozeId}
                  className="rounded-[10px] bg-canvas px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 text-[13px] font-semibold text-ink-900">
                      {entry.headline}
                    </span>
                    <button
                      type="button"
                      onClick={() => wake(entry.snoozeId)}
                      disabled={waking === entry.snoozeId}
                      className="shrink-0 text-[12px] font-medium text-violet-ink hover:underline disabled:text-ink-400"
                    >
                      {waking === entry.snoozeId ? "Restoring…" : "Put it back"}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                  <p className="mono mt-1 text-[11px] text-ink-400">
                    {entry.owner} · {entry.snoozedAt} · {entry.impactLabel} ·{" "}
                    {entry.scopeLabel} ·{" "}
                    {entry.untilVisit
                      ? "back at the next visit"
                      : "back only if it worsens"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export type { SnoozeRecord };
