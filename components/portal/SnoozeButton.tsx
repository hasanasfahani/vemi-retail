"use client";

/* Parking a finding — deliberately not a one-click hide.

   A control that makes something disappear in one tap gets used
   reflexively, and a queue people reflexively clear is a queue nobody
   reads. This one asks for two things: how long, and why. The "why" is
   required by the API, not just the form — it is the entire difference
   between a record that says "considered and declined" and one
   indistinguishable from never having been opened.

   Rendered through a portal for the same reason ActionSheet is: these
   cards sit inside `.portal-content`, whose page transition sets a
   transform, and a `position: fixed` overlay inside a transformed
   ancestor resolves against that ancestor rather than the viewport.
   That bug shipped once already — a modal rendering 6,807px down the
   page while every DOM test passed. */

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { readAccessSnapshot } from "@/lib/demoAccess";
import type { Insight } from "@/lib/insights";
import type { SnoozeUntil } from "@/lib/snoozeShared";

const noopSubscribe = () => () => {};

type Props = {
  insight: Insight;
  visit: string;
  /* Called once the write succeeds, so the host can drop the card. */
  onSnoozed?: () => void;
};

export default function SnoozeButton({ insight, visit, onSnoozed }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={done}
        className="text-[12px] font-medium text-ink-400 hover:text-ink-700 disabled:text-ink-400"
      >
        {done ? "Parked ✓" : "Not this cycle"}
      </button>
      {open && (
        <SnoozeSheet
          insight={insight}
          visit={visit}
          onClose={() => setOpen(false)}
          onDone={() => {
            setDone(true);
            setOpen(false);
            onSnoozed?.();
          }}
        />
      )}
    </>
  );
}

function SnoozeSheet({
  insight,
  visit,
  onClose,
  onDone,
}: {
  insight: Insight;
  visit: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);
  const [until, setUntil] = useState<SnoozeUntil>("next-visit");
  const [reason, setReason] = useState("");
  const [owner, setOwner] = useState(session?.fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const reasonId = useId();
  const ownerId = useId();

  /* Escape, focus trap, focus restoration, scroll lock — the same
     contract ActionSheet honours, because these two are the product's
     only modals and behaving differently would be its own bug. */
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(
      () => panel.current?.querySelector<HTMLElement>("textarea")?.focus(),
      0
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(id);
      restoreTo?.focus?.();
    };
  }, [onClose]);

  const submit = async () => {
    if (!reason.trim() || !owner.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/snoozes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insightId: insight.id,
          rule: insight.rule,
          headline: insight.headline,
          reason: reason.trim(),
          owner: owner.trim(),
          until,
          visit,
          baselineImpact: insight.impact.value,
          baselineSeverity: insight.severity,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          data?.error === "not_configured"
            ? "The snooze store isn't set up yet — nothing was parked."
            : "That didn't save. The finding is still on the list."
        );
        setSaving(false);
        return;
      }
      onDone();
    } catch {
      setError("That didn't save. The finding is still on the list.");
      setSaving(false);
    }
  };

  /* No mounted flag: the sheet is only ever rendered after a click, so
     it never exists during server rendering or hydration — the same
     reasoning ActionSheet documents. */
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/30 p-0 sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Park this finding"
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-[18px] bg-white p-5 shadow-[var(--shadow-lift)] sm:rounded-[18px] sm:p-6"
      >
        <h2 className="t-h3 !text-[16px]">Not this cycle</h2>
        <p className="mt-1 text-[13px] leading-snug text-ink-500">
          {insight.headline}
        </p>
        <p className="mono mt-1 text-[12px] text-ink-400">
          {insight.impact.label} · {insight.scope.label}
        </p>

        <fieldset className="mt-4">
          <legend className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Bring it back
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            <Choice
              checked={until === "next-visit"}
              onChange={() => setUntil("next-visit")}
              title="At the next visit"
              hint="Sleeps through this cycle. Back when the shelf is next audited."
            />
            <Choice
              checked={until === "worsens"}
              onChange={() => setUntil("worsens")}
              title="Only if it gets worse"
              hint="No time limit — but it returns the moment its severity rises or its impact grows by 25%."
            />
          </div>
        </fieldset>

        <div className="mt-4">
          <label
            htmlFor={reasonId}
            className="text-[11px] font-semibold uppercase tracking-wide text-ink-400"
          >
            Why not this cycle
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. ERB-105 is a kiosk — it will never carry 2.25L PET."
            className="mt-1.5 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[13.5px] text-ink-900 outline-none focus:border-violet"
          />
          <p className="mt-1 text-[12px] text-ink-400">
            Required. Next cycle this is what tells the reader it was
            considered rather than missed.
          </p>
        </div>

        <div className="mt-3">
          <label
            htmlFor={ownerId}
            className="text-[11px] font-semibold uppercase tracking-wide text-ink-400"
          >
            Parked by
          </label>
          <input
            id={ownerId}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="mt-1.5 w-full rounded-[10px] border border-line bg-canvas px-3 py-2 text-[13.5px] text-ink-900 outline-none focus:border-violet"
          />
        </div>

        {error && (
          <p
            className="mt-3 rounded-[10px] px-3 py-2 text-[13px]"
            style={{
              background: "var(--color-critical-wash, #fbeded)",
              color: "var(--color-critical)",
            }}
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost !py-2 text-sm">
            Keep it on the list
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reason.trim() || !owner.trim() || saving}
            className="btn-primary !py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Parking…" : "Park it"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Choice({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-[10px] border p-3 transition-colors ${
        checked ? "border-violet bg-violet-050" : "border-line hover:bg-canvas"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--color-violet)]"
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink-900">{title}</span>
        <span className="block text-[12px] leading-snug text-ink-500">{hint}</span>
      </span>
    </label>
  );
}
