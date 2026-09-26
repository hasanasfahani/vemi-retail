"use client";

/* The report's name, editable in place.

   ONE RENAME INTERACTION, NOT TWO. The brief gated access to a new
   report behind confirming its name, which needs a second control for
   renaming later and leaves an abandoned rename as an orphan nobody
   meant to make. Creating first and editing in place means the same
   control does both, and nothing is ever lost by walking away —
   Escape simply keeps what was there. */

import { useEffect, useRef, useState } from "react";

export default function ReportTitle({
  name,
  onRename,
  /* A report arriving straight from the + opens with its name selected,
     because the first thing anyone does is name it. */
  autoEdit = false,
}: {
  name: string;
  onRename: (name: string) => void;
  autoEdit?: boolean;
}) {
  const [editing, setEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(name);
  const field = useRef<HTMLInputElement>(null);

  /* The draft is seeded when editing STARTS rather than synced from
     the prop by an effect — the prop only matters at the moment the
     field opens, and syncing it on every render is a cascade React is
     right to warn about. */
  const startEditing = () => {
    setDraft(name);
    setEditing(true);
  };

  useEffect(() => {
    if (!editing) return;
    field.current?.focus();
    field.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        title="Rename this report"
        className="group -mx-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-1 text-left transition-colors hover:bg-canvas"
      >
        <span className="truncate text-[32px] font-semibold leading-10 tracking-[-0.01em] text-ink-900 sm:text-[44px] sm:leading-[52px] sm:tracking-[-0.02em]">
          {name}
        </span>
        <svg
          viewBox="0 0 16 16"
          className="h-5 w-5 shrink-0 text-line-strong transition-colors group-hover:text-ink-900"
          fill="none" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden
        >
          <path d="M11.5 2.5l2 2L6 12l-3 1 1-3z" />
        </svg>
        <span className="sr-only">Rename this report</span>
      </button>
    );
  }

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== name) onRename(draft);
  };

  return (
    <input
      ref={field}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        /* Escape keeps the name it had. Walking away costs nothing. */
        if (e.key === "Escape") {
          setDraft(name);
          setEditing(false);
        }
      }}
      aria-label="Report name"
      className="min-w-0 max-w-[720px] flex-1 rounded-md border border-primary bg-white px-3 py-1 text-[32px] font-semibold leading-10 text-ink-900 outline-none sm:text-[44px] sm:leading-[52px]"
    />
  );
}
