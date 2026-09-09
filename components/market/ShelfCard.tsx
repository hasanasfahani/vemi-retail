"use client";

/* One outlet's shelf, as a card — and, clicked, as a lightbox.

   The overlay toggle is the honest version of the brief's "AI-style
   detection": it draws boxes around packs the audit actually recorded,
   labelled with the brand and facing count that were observed. Nothing
   is inferred by looking at a picture, because the picture came from
   the observations. */

import { useState } from "react";
import ShelfScene from "./ShelfScene";
import Badge from "./ui/Badge";
import { scoreBand } from "./ui/health";
import { channelName, cityName } from "@/lib/market";
import type { Cell, Pos } from "@/lib/market/types";

export default function ShelfCard({
  outlet,
  cells,
  score,
  auditedAt,
  caption,
}: {
  outlet: Pos;
  cells: Cell[];
  score?: number;
  auditedAt?: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const [overlays, setOverlays] = useState(true);
  const gaps = cells.filter((c) => c.state === "out-of-stock").length;

  return (
    <>
      <figure className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block text-left"
          aria-label={`Open shelf view for ${outlet.name}`}
        >
          <ShelfScene cells={cells} height={168} />
          <span className="absolute right-2 top-2 rounded-full bg-ink-900/70 px-2 py-[3px] text-[10.5px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            Enlarge
          </span>
        </button>
        <figcaption className="flex min-w-0 flex-col gap-1 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink-900">
              {outlet.name}
            </span>
            {score !== undefined && <Badge band={scoreBand(score)} label={`${score}`} size="sm" />}
          </div>
          <span className="truncate text-[11.5px] text-ink-500">
            {outlet.district}, {cityName(outlet.cityId)} · {channelName(outlet.channel)}
          </span>
          <span className="mono text-[11px] text-ink-400">
            {caption ??
              `${cells.length} lines checked · ${gaps} out of stock${
                auditedAt ? ` · ${auditedAt}` : ""
              }`}
          </span>
        </figcaption>
      </figure>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Shelf view, ${outlet.name}`}
            className="relative w-full max-w-[820px] rounded-[16px] border border-line bg-white p-4 shadow-[var(--shadow-pop)]"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-[15px] font-bold tracking-tight text-ink-900">
                  {outlet.name}
                </h2>
                <p className="text-[12px] text-ink-500">
                  {outlet.district}, {cityName(outlet.cityId)} · {channelName(outlet.channel)}
                  {auditedAt ? ` · audited ${auditedAt}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOverlays((v) => !v)}
                  aria-pressed={overlays}
                  className={`rounded-[9px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    overlays
                      ? "border-violet-100 bg-violet-050 text-violet-ink"
                      : "border-line-strong bg-white text-ink-700 hover:border-ink-400"
                  }`}
                >
                  Detections
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-md p-1 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-700"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="m4 4 8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>

            <ShelfScene cells={cells} height={360} overlays={overlays} maxFacings={40} />

            <p className="mt-2 text-[11px] leading-snug text-ink-400">
              Drawn from this outlet&apos;s audited rows — every pack, facing count and empty slot
              on the shelf is an observation from the visit, not an illustration.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
