"use client";

/* Geo-stamped shelf photography — the trust lever over distributor-
   reported numbers. Every frame carries the outlet, the audit
   reference and the capture time burned in by the field app. */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { photos, posLabel } from "@/lib/portalData";

const captured = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ShelfPhotos({ limit }: { limit?: number }) {
  const shown = limit ? photos.slice(0, limit) : photos;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) =>
        i === null ? i : (i + dir + shown.length) % shown.length
      ),
    [shown.length]
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

  const active = openIndex === null ? null : shown[openIndex];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {shown.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative h-[132px] w-[99px] shrink-0 overflow-hidden rounded-[10px] border border-line bg-canvas transition-colors hover:border-ink-400"
            aria-label={`Open shelf photo from ${posLabel(photo.posId)}`}
          >
            <Image
              src={photo.file}
              alt={`Shelf at ${posLabel(photo.posId)}`}
              fill
              sizes="99px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

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
                <div className="truncate text-sm font-semibold text-ink-900">
                  {posLabel(active.posId)}
                </div>
                <div className="mono text-[12px] text-ink-500">
                  Audit #{active.auditRef} · {captured(active.capturedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <NavButton label="Previous photo" onClick={() => step(-1)}>
                  <path d="M11 4 6 9l5 5" />
                </NavButton>
                <NavButton label="Next photo" onClick={() => step(1)}>
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
                alt={`Shelf at ${posLabel(active.posId)}`}
                width={900}
                height={1200}
                className="mx-auto max-h-[70vh] w-auto object-contain"
                priority
              />
            </div>

            <div className="border-t border-line px-5 py-2.5 text-[12px] text-ink-500">
              Frame {openIndex! + 1} of {shown.length} · captured in-store by the
              field auditor
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
      <svg
        viewBox="0 0 18 18"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
