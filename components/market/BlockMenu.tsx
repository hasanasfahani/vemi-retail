"use client";

/* Everything you can do to one block, behind one control.

   A block carries a lot of possible actions — scope, rename, duplicate,
   move, remove — and putting them on the card would give every panel a
   toolbar competing with the figure it is meant to be showing. One
   control, opened deliberately.

   MOVE UP AND MOVE DOWN ARE NOT A FALLBACK. Dragging is the fast path
   for reordering and it is unusable from a keyboard, so the same
   operation lives here where it can be reached by tab and Enter. */

import { useEffect, useRef, useState } from "react";
import Dropdown from "./Dropdown";
import { months } from "@/lib/market";
import { FILTER_KEYS, FILTER_META, type FilterKey } from "@/lib/market/filters";
import { FILTER_OPTIONS } from "@/lib/market/filterOptions";
import { hasScope, type BlockScope, type ReportBlock } from "@/lib/market/reports";
import type { BlockDef } from "@/lib/market/reportBlocks";

export default function BlockMenu({
  block,
  def,
  index,
  total,
  onScope,
  onTitle,
  onMove,
  onDuplicate,
  onRemove,
}: {
  block: ReportBlock;
  def: BlockDef;
  index: number;
  total: number;
  onScope: (scope: BlockScope) => void;
  onTitle: (title: string | undefined) => void;
  onMove: (to: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<"menu" | "scope" | "rename">("menu");
  const [draft, setDraft] = useState(block.title ?? def.label);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const scope = block.scope ?? {};

  /* A block that compares brands cannot honour a brand or SKU filter,
     so those controls are absent rather than present and ignored. */
  const keys: FilterKey[] = def.ignoresBrandFilter
    ? FILTER_KEYS.filter((k) => k !== "brands" && k !== "skus")
    : [...FILTER_KEYS];

  const toggle = (key: FilterKey, value: string) => {
    const held = scope[key] ?? [];
    const next = held.includes(value) ? held.filter((v) => v !== value) : [...held, value];
    onScope({ ...scope, [key]: next });
  };

  const item =
    "flex w-full items-center justify-between gap-3 rounded-md px-2 py-[6px] text-left text-[12.5px] text-ink-700 transition-colors hover:bg-canvas disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => {
          setPane("menu");
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={`Settings for ${block.title ?? def.label}`}
        title="Block settings"
        className="flex h-6 w-6 items-center justify-center rounded-[7px] text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3.5" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="12.5" r="1.3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-[248px] rounded-[10px] border border-line bg-white p-1 text-left shadow-[var(--shadow-pop)]">
          {pane === "menu" && (
            <>
              <button type="button" className={item} onClick={() => setPane("scope")}>
                Scope
                <span className="mono text-[11px] text-ink-400">
                  {hasScope(block.scope) ? "its own" : "the page"}
                </span>
              </button>
              <button type="button" className={item} onClick={() => setPane("rename")}>
                Rename
              </button>
              <button type="button" className={item} onClick={() => { onDuplicate(); setOpen(false); }}>
                Duplicate
              </button>
              <div className="my-1 h-px bg-line" />
              <button
                type="button"
                className={item}
                disabled={index === 0}
                onClick={() => onMove(index - 1)}
              >
                Move up
              </button>
              <button
                type="button"
                className={item}
                disabled={index >= total - 1}
                onClick={() => onMove(index + 1)}
              >
                Move down
              </button>
              <div className="my-1 h-px bg-line" />
              <button
                type="button"
                className={`${item} text-[color:var(--color-critical)]`}
                onClick={() => { onRemove(); setOpen(false); }}
              >
                Remove
              </button>
            </>
          )}

          {pane === "scope" && (
            <div className="flex flex-col gap-2 p-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  This block only
                </span>
                <button
                  type="button"
                  onClick={() => setPane("menu")}
                  className="text-[11.5px] font-semibold text-ink-500 hover:text-ink-900"
                >
                  Back
                </button>
              </div>
              <p className="text-[11.5px] leading-snug text-ink-500">
                Leave a control empty and this block follows the filters at the top of the page.
              </p>

              <Dropdown
                label="Period"
                summary={
                  scope.month
                    ? months.find((m) => m.id === scope.month)?.label ?? scope.month
                    : "Follow the page"
                }
                active={Boolean(scope.month)}
                single
                selected={scope.month ? [scope.month] : []}
                options={[
                  { value: "", label: "Follow the page" },
                  ...months.map((m) => ({ value: m.id, label: m.label })),
                ]}
                onToggle={(value) => onScope({ ...scope, month: value || undefined })}
              />

              {keys.map((key) => (
                <Dropdown
                  key={key}
                  label={FILTER_META[key].label}
                  summary={
                    scope[key]?.length
                      ? `${scope[key]!.length} selected`
                      : "Follow the page"
                  }
                  active={Boolean(scope[key]?.length)}
                  selected={scope[key] ?? []}
                  options={FILTER_OPTIONS[key]}
                  onToggle={(value) => toggle(key, value)}
                />
              ))}

              {def.ignoresBrandFilter && (
                <p className="text-[11px] leading-snug text-ink-400">
                  This block compares every brand, so it has no brand or SKU control — a comparison
                  with five of six brands removed is not a comparison.
                </p>
              )}

              {hasScope(block.scope) && (
                <button
                  type="button"
                  onClick={() => onScope({})}
                  className="rounded-[8px] border border-line-strong bg-white px-2 py-1 text-[11.5px] font-semibold text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-900"
                >
                  Follow the page again
                </button>
              )}
            </div>
          )}

          {pane === "rename" && (
            <div className="flex flex-col gap-2 p-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                What this block is here to say
              </span>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onTitle(draft === def.label ? undefined : draft);
                    setOpen(false);
                  }
                }}
                className="w-full rounded-[8px] border border-line-strong px-2 py-1 text-[12.5px] outline-none focus:border-violet"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onTitle(draft === def.label ? undefined : draft);
                    setOpen(false);
                  }}
                  className="rounded-[8px] bg-violet px-2 py-1 text-[11.5px] font-semibold text-white hover:bg-violet-ink"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setDraft(def.label); onTitle(undefined); setOpen(false); }}
                  className="rounded-[8px] border border-line-strong bg-white px-2 py-1 text-[11.5px] font-semibold text-ink-500 hover:border-ink-400 hover:text-ink-900"
                >
                  Use the default
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
