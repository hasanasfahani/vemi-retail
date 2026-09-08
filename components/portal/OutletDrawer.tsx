"use client";

/* Outlet detail — the second layer.

   Every outlet code in the portal is a control: clicking one slides in
   this panel with that outlet's own profile, its gaps, its price
   breaches and, where we hold it, its shelf photography. Nothing on a
   list page has to carry outlet-level detail it doesn't have room for.
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  latest,
  photosFor,
  posOf,
  skuOf,
  skuName,
  brandName,
  brandOf,
  clientBrand,
  skus,
} from "@/lib/portalData";
import { scope } from "@/lib/portal";

type DrawerApi = { open: (posId: string) => void };
const Ctx = createContext<DrawerApi>({ open: () => {} });

export function useOutletDrawer() {
  return useContext(Ctx);
}

export default function OutletDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [posId, setPosId] = useState<string | null>(null);

  const api = useMemo<DrawerApi>(() => ({ open: setPosId }), []);
  const close = useCallback(() => setPosId(null), []);

  useEffect(() => {
    if (!posId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [posId, close]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {posId && <Panel posId={posId} onClose={close} />}
    </Ctx.Provider>
  );
}

/* The clickable outlet code used across tables and the heatmap. */
export function OutletButton({
  posId,
  children,
  className = "",
}: {
  posId: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { open } = useOutletDrawer();
  const outlet = posOf(posId);
  return (
    <button
      type="button"
      onClick={() => open(posId)}
      className={`mono font-semibold text-ink-900 underline decoration-line-strong decoration-1 underline-offset-2 transition-colors hover:text-violet-ink hover:decoration-violet ${className}`}
      title={`Open ${outlet?.code} detail`}
    >
      {children ?? outlet?.code}
    </button>
  );
}

function Panel({ posId, onClose }: { posId: string; onClose: () => void }) {
  const outlet = posOf(posId)!;
  /* The drawer always reports the outlet as it stands on the latest
     visit — it is a record of the store, not of the filtered view. */
  const cells = latest.matrix.filter((c) => c.posId === posId);
  const gaps = latest.oos.filter((r) => r.posId === posId);
  const breaches = latest.observations.filter(
    (o) => o.posId === posId && o.outlier
  );
  const { frames, isOwn } = photosFor(posId);

  const listed = cells.filter((c) => c.state !== "not-listed");
  const stocked = cells.filter((c) => c.state === "in-stock");
  const clientListed = listed.filter(
    (c) => skuOf(c.skuId)?.brandId === clientBrand.id
  );
  const perf = {
    availability: listed.length
      ? Math.round((stocked.length / listed.length) * 1000) / 10
      : 0,
    clientAvailability: clientListed.length
      ? Math.round(
          (clientListed.filter((c) => c.state === "in-stock").length /
            clientListed.length) *
            1000
        ) / 10
      : 0,
    skusListed: listed.length,
    skusInStock: stocked.length,
  };

  const facings = stocked.reduce((s, c) => s + c.facings, 0);
  const clientFacings = stocked
    .filter((c) => skuOf(c.skuId)?.brandId === clientBrand.id)
    .reduce((s, c) => s + c.facings, 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end"
      style={{ background: "rgba(20,21,26,0.42)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${outlet.code} detail`}
    >
      <div className="panel-in flex h-full w-full max-w-[520px] flex-col bg-white shadow-[var(--shadow-surface)]">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <span className="t-eyebrow">Outlet</span>
            <h2 className="t-h3 mono mt-1">{outlet.code}</h2>
            <p className="mt-1 text-sm text-ink-500">
              {outlet.name ? `${outlet.name} · ` : ""}
              {outlet.area} · {outlet.channel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-2 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Category availability" value={`${perf.availability}%`} />
            <Metric
              label={`${clientBrand.name} availability`}
              value={`${perf.clientAvailability}%`}
            />
            <Metric label="SKUs on shelf" value={`${perf.skusInStock} / ${perf.skusListed}`} />
            <Metric
              label="Your share of facings"
              value={`${facings ? Math.round((clientFacings / facings) * 100) : 0}%`}
              sub={`${clientFacings} of ${facings}`}
            />
          </div>

          {gaps.length > 0 && (
            <Section title={`Open gaps (${gaps.length})`}>
              {gaps
                .sort((a, b) => b.facingDaysAtRisk - a.facingDaysAtRisk)
                .map((gap) => (
                  <div
                    key={gap.skuId}
                    className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <span
                        className={`text-[13px] ${
                          skuOf(gap.skuId)?.brandId === clientBrand.id
                            ? "font-semibold text-ink-900"
                            : "text-ink-700"
                        }`}
                      >
                        {skuName(gap.skuId)}
                      </span>
                      {gap.rivalsInStock.length > 0 && (
                        <span className="block text-[11px] text-ink-400">
                          Space held by{" "}
                          {gap.rivalsInStock
                            .map((r) => brandName(r.brandId))
                            .join(", ")}
                        </span>
                      )}
                    </div>
                    {/* Was days-out. A single audit sees an empty slot,
                        never how long it has been empty. */}
                    <span
                      className="mono shrink-0 text-[13px] font-semibold"
                      style={{ color: "var(--color-critical)" }}
                    >
                      {gap.normalFacings} facings
                    </span>
                  </div>
                ))}
            </Section>
          )}

          {breaches.length > 0 && (
            <Section title={`Price breaches (${breaches.length})`}>
              {breaches.map((b) => (
                <div
                  key={b.skuId}
                  className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0"
                >
                  <span className="text-[13px] text-ink-700">
                    {skuName(b.skuId)}
                  </span>
                  <span className="mono shrink-0 text-[13px]">
                    <span className="text-ink-900">
                      {b.price.toLocaleString()}
                    </span>
                    <span
                      className="ml-1.5 font-semibold"
                      style={{ color: "var(--color-serious)" }}
                    >
                      +{b.variance}%
                    </span>
                  </span>
                </div>
              ))}
            </Section>
          )}

          <Section title={`Shelf inventory (${scope.skuCount} SKUs audited)`}>
            {skus.map((sku) => {
              const cell = cells.find((c) => c.skuId === sku.id);
              if (!cell) return null;
              const isClient = sku.brandId === clientBrand.id;
              return (
                <div
                  key={sku.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-0"
                >
                  <span className="min-w-0 truncate text-[13px]">
                    <span
                      className={isClient ? "font-semibold text-ink-900" : "text-ink-700"}
                    >
                      {sku.name}
                    </span>
                    <span className="ml-1.5 text-[11px] text-ink-400">
                      {brandOf(sku.brandId)?.name}
                    </span>
                  </span>
                  <StateTag state={cell.state} facings={cell.facings} />
                </div>
              );
            })}
          </Section>

          <Section title="Shelf photography">
            <div className="flex gap-2 overflow-x-auto">
              {frames.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-[124px] w-[93px] shrink-0 overflow-hidden rounded-[8px] border border-line"
                >
                  <Image
                    src={photo.file}
                    alt={`Shelf at ${outlet.code}`}
                    fill
                    sizes="93px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-ink-400">
                {isOwn
                  ? `Captured ${scope.dataAsOf} · audit #${frames[0].auditRef}`
                  : `Reference frames · own capture syncs with the next visit`}
              </p>
              <Link
                href={`/dashboard/outlets/${outlet.code}`}
                className="shrink-0 text-[12px] font-semibold text-violet-ink hover:underline"
              >
                See more →
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[10px] bg-canvas p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </div>
      <div className="tnum mt-1 !text-xl">{value}</div>
      {sub && <div className="text-[11px] text-ink-500">{sub}</div>}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StateTag({ state, facings }: { state: string; facings: number }) {
  if (state === "in-stock")
    return (
      <span className="mono shrink-0 text-[12px] text-ink-700">
        {facings} facings
      </span>
    );
  if (state === "out-of-stock")
    return <span className="pill pill-critical shrink-0">Out of stock</span>;
  return <span className="shrink-0 text-[12px] text-ink-400">Not listed</span>;
}
