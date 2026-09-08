"use client";

/* The sheet that stands between an action button and the queue.

   Every control used to write on click: owner set silently from the
   session, no due date at all, and the findings flattened into a text
   blob. This is where those become choices — and where the work gets
   its line items, which is what makes the Priorities card tickable at
   the other end.

   Everything is pre-filled, so the fast path stays one click plus one
   confirm. Nothing here asks a question the engine already answered. */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nextVisitDate, describeDueDate } from "@/lib/cadence";
import type { ActionItem } from "@/lib/actionsShared";

export type SheetDraft = {
  /* When the work has a number worth verifying afterwards, the sheet
     offers to start watching it in the same gesture. Deciding to fix
     something and deciding to check whether the fix held are the same
     moment, and this is where that moment already happens. */
  watch?: import("@/components/portal/WatchButton").WatchTarget;
  title: string;
  rule: string;
  where: string;
  notes: string;
  insightId?: string;
  items: ActionItem[];
  /* Named for the archetype, so the sheet can label its scope band in
     the reader's language rather than "items". */
  itemNoun: string;
  /* Extra, archetype-specific line shown under the title. */
  context?: string;
};

type Props = {
  draft: SheetDraft;
  defaultOwner: string;
  /* Owners already present in the base — the roster maintains itself
     rather than being configured. */
  ownerSuggestions: string[];
  /* Open actions already covering these findings, if any. */
  duplicateWarning?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    owner: string;
    dueDate: string;
    notes: string;
    rule: string;
    where: string;
    insightId?: string;
    items: ActionItem[];
  }) => Promise<void>;
};

export default function ActionSheet({
  draft,
  defaultOwner,
  ownerSuggestions,
  duplicateWarning,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(draft.title);
  const [owner, setOwner] = useState(defaultOwner);
  const [dueDate, setDueDate] = useState(nextVisitDate());
  const [notes, setNotes] = useState(draft.notes);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(draft.items.map((i) => i.id))
  );
  const [alsoWatch, setAlsoWatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const listId = useId();

  /* The sheet renders into document.body rather than in place.

     `.portal-content` runs an entrance animation, and a transform on
     any ancestor makes `position: fixed` resolve against THAT element
     instead of the viewport — which put this overlay 6,800px tall
     starting 127px down the page, so the sheet opened far below the
     fold. Every DOM-driven test still passed, because clicking and
     querying work wherever a node happens to sit; only looking at it
     caught it. A portal removes the whole class of bug.

     No mounted flag is needed to keep the portal SSR-safe: this
     component is only ever rendered after a click, so it never exists
     during server rendering or hydration. */

  /* Focus goes into the sheet on open and back to the button that
     opened it on close — a dialog that drops focus to the top of the
     document strands a keyboard reader mid-page. */
  useEffect(() => {
    opener.current = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>(
      "input, textarea, button"
    );
    first?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'input, textarea, button, [href], select, [tabindex]:not([tabindex="-1"])'
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
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const chosen = draft.items.filter((i) => selected.has(i.id));
  const hasScope = draft.items.length > 0;
  const canSubmit =
    title.trim() && owner.trim() && (!hasScope || chosen.length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        owner: owner.trim(),
        dueDate,
        notes: notes.trim(),
        rule: draft.rule,
        where: draft.where,
        insightId: draft.insightId,
        items: chosen.map((i) => ({ ...i, done: false })),
      });

      /* The monitor is created after the action, and its failure is
         reported without unwinding the action — the work item is the
         thing that matters, and silently discarding a saved action
         because a follow-on write failed would be worse than a
         partial success the reader is told about. */
      if (alsoWatch && draft.watch) {
        try {
          const res = await fetch("/api/monitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: draft.watch.label,
              metric: draft.watch.metric,
              segmentType: draft.watch.segmentType,
              segment: draft.watch.segment,
              filters: draft.watch.filters ?? {},
              baseline: draft.watch.currentValue,
              visit: draft.watch.visit,
              owner: owner.trim(),
              target: draft.watch.suggestedTarget?.value ?? null,
            }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.ok) throw new Error("monitor failed");
        } catch {
          setSaving(false);
          setError(
            "The action saved, but the watch didn't. Add it from the chart when you get a moment."
          );
          return;
        }
      }
    } catch {
      /* The sheet stays open with everything the reader typed still in
         it — losing a filled form to a network blip is the fastest way
         to make someone stop trusting the button. */
      setError("Couldn't save that. Your input is still here — try again.");
      setSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={draft.title}
        className="flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[18px] border border-line bg-white sm:rounded-[18px]"
      >
        <div className="border-b border-line px-5 pb-4 pt-5">
          <h2 className="t-h3 !text-[17px] leading-snug">{draft.title}</h2>
          {draft.context && (
            <p className="mt-1 text-[13px] text-ink-500">{draft.context}</p>
          )}
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {duplicateWarning && (
              <p
                className="rounded-[10px] px-3 py-2 text-[12.5px]"
                style={{
                  background: "color-mix(in srgb, var(--color-warn) 14%, #fff)",
                  color: "var(--color-ink-700)",
                }}
              >
                {duplicateWarning}
              </p>
            )}

            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13.5px] text-ink-900 outline-none focus:border-violet"
              />
            </Field>

            {hasScope && (
              <Field
                label={`What goes in — ${chosen.length} of ${draft.items.length} ${draft.itemNoun}`}
              >
                <div className="max-h-[210px] overflow-y-auto rounded-[9px] border border-line">
                  {draft.items.map((item) => {
                    const on = selected.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-line px-2.5 py-1.5 text-[13px] last:border-0 hover:bg-canvas"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            })
                          }
                          className="h-[14px] w-[14px] accent-[var(--color-violet)]"
                        />
                        <span className="font-semibold text-ink-900">
                          {item.label}
                        </span>
                        {item.where && (
                          <span className="truncate text-ink-500">
                            · {item.where}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11.5px] text-ink-400">
                  Anything you leave out stays flagged on the chart — it is not
                  dismissed, just not in this run.
                </p>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner">
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  list={listId}
                  placeholder="Who's doing this"
                  className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13.5px] text-ink-900 outline-none focus:border-violet"
                />
                <datalist id={listId}>
                  {ownerSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </Field>

              <Field label="Due">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13.5px] text-ink-900 outline-none focus:border-violet"
                />
                <p className="mt-1 text-[11.5px] text-ink-400">
                  {describeDueDate(dueDate)}
                </p>
              </Field>
            </div>

            {draft.watch && (
              <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-line p-3">
                <input
                  type="checkbox"
                  checked={alsoWatch}
                  onChange={(e) => setAlsoWatch(e.target.checked)}
                  className="mt-0.5 h-[14px] w-[14px] accent-[var(--color-violet)]"
                />
                <span className="text-[13px] leading-snug">
                  <span className="font-semibold text-ink-900">
                    Also watch this after the work is done
                  </span>
                  <span className="block text-[11.5px] text-ink-400">
                    Tracks {draft.watch.label} from{" "}
                    {draft.watch.currentValue}
                    {draft.watch.suggestedTarget
                      ? ` toward ${draft.watch.suggestedTarget.value}`
                      : ""}{" "}
                    on the Watchlist.
                  </span>
                </span>
              </label>
            )}

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13px] text-ink-900 outline-none focus:border-violet"
              />
            </Field>

            {error && (
              <p
                className="text-[12.5px] font-medium"
                style={{ color: "var(--color-critical)" }}
              >
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
              disabled={!canSubmit || saving}
              className="rounded-[8px] bg-violet px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-ink disabled:bg-line-strong disabled:text-ink-400"
            >
              {saving
                ? "Adding…"
                : hasScope
                  ? `Add ${chosen.length} to Priorities`
                  : "Add to Priorities"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      {children}
    </label>
  );
}
