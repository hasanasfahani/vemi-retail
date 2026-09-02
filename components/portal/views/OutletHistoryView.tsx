"use client";

/* Outlet photo history — the page behind "See more" in the drawer.

   Frames are grouped by field visit, newest first. Only the latest
   visit's frames are held on this plan; earlier ones sit in the archive
   and are shown as a locked row rather than as invented photography. */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  photosFor,
  posOf,
  latest,
  currentVisit,
  visits,
  clientBrand,
  skuOf,
} from "@/lib/portalData";
import { scope } from "@/lib/portal";

const captured = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function OutletHistoryView({ posId }: { posId: string }) {
  const outlet = posOf(posId)!;
  const { frames, isOwn } = photosFor(posId);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) =>
        i === null ? i : (i + dir + frames.length) % frames.length
      ),
    [frames.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openIndex, close, step]);

  const cells = latest.matrix.filter((c) => c.posId === posId);
  const gaps = latest.oos.filter((r) => r.posId === posId);
  const stocked = cells.filter((c) => c.state === "in-stock");
  const clientGaps = gaps.filter(
    (g) => skuOf(g.skuId)?.brandId === clientBrand.id
  ).length;

  const archived = visits.filter((v) => v.id !== currentVisit).reverse();
  const active = openIndex === null ? null : frames[openIndex];

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-ink-500">
        <Link href="/dashboard/availability" className="hover:text-ink-900">
          Outlets
        </Link>
        <span aria-hidden>/</span>
        <span className="mono font-semibold text-ink-900">{outlet.code}</span>
      </nav>

      <div className="mb-6">
        <h1 className="t-h3 !text-2xl">
          {outlet.name ?? outlet.code} · Photo history
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {outlet.area} · {outlet.channel} · {stocked.length} SKUs on shelf ·{" "}
          {gaps.length} open gap{gaps.length === 1 ? "" : "s"}
          {clientGaps > 0 && ` (${clientGaps} on ${clientBrand.name})`}
        </p>
      </div>

      <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-h3">{scope.dataAsOf}</h2>
          <span className="text-[13px] text-ink-500">
            {frames.length} frames · audit #{frames[0].auditRef}
          </span>
        </div>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          {isOwn
            ? "Captured in store by the field auditor, geo-stamped on capture."
            : `Reference frames for this fixture type. ${outlet.code}'s own capture syncs with the next visit.`}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {frames.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative aspect-[3/4] overflow-hidden rounded-[10px] border border-line bg-canvas transition-colors hover:border-ink-400"
              aria-label={`Open frame ${i + 1}`}
            >
              <Image
                src={photo.file}
                alt={`Shelf at ${outlet.code}, frame ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </section>

      {archived.map((visit) => (
        <section
          key={visit.id}
          className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="t-h3 flex items-center gap-2">
                {visit.label}
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                  <path d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7" />
                </svg>
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Photography from earlier visits is retained in the audit
                archive. Full frame history is part of the annual plan.
              </p>
            </div>
            <Link href="/#packages" className="btn-primary !py-2 text-sm">
              Unlock archive
            </Link>
          </div>
        </section>
      ))}

      {active && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(20,21,26,0.72)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Shelf photo"
        >
          <div className="panel-in flex max-h-full w-full max-w-[860px] flex-col overflow-hidden rounded-[18px] bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
              <div className="min-w-0">
                <div className="mono truncate text-sm font-semibold text-ink-900">
                  {outlet.code}
                  {outlet.name ? ` · ${outlet.name}` : ""}
                </div>
                <div className="mono text-[12px] text-ink-500">
                  Audit #{active.auditRef} · {captured(active.capturedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <NavButton label="Previous frame" onClick={() => step(-1)}>
                  <path d="M11 4 6 9l5 5" />
                </NavButton>
                <NavButton label="Next frame" onClick={() => step(1)}>
                  <path d="M7 4l5 5-5 5" />
                </NavButton>
                <NavButton label="Close" onClick={close}>
                  <path d="M5 5l8 8M13 5l-8 8" />
                </NavButton>
              </div>
            </div>
            <div className="relative min-h-0 flex-1 bg-canvas">
              <Image
                src={active.file}
                alt={`Shelf at ${outlet.code}`}
                width={900}
                height={1200}
                className="mx-auto max-h-[70vh] w-auto object-contain"
                priority
              />
            </div>
            <div className="border-t border-line px-5 py-2.5 text-[12px] text-ink-500">
              Frame {openIndex! + 1} of {frames.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-canvas hover:text-ink-900"
    >
      <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
