"use client";

/* Sortable outlet table — worst performers first by default, because
   that is the list a sales director acts on. Also the table-view twin
   for the heatmap above it. Each code opens the outlet's own detail. */

import { useMemo, useState } from "react";
import { posOf, clientBrand } from "@/lib/portalData";
import { OutletButton } from "@/components/portal/OutletDrawer";
import type { FilteredView } from "@/lib/portalFilters";

type SortKey = "code" | "area" | "channel" | "availability" | "client" | "gaps";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "code", label: "Outlet" },
  { key: "area", label: "District" },
  { key: "channel", label: "Channel" },
  { key: "availability", label: "Category avail.", numeric: true },
  { key: "client", label: `${clientBrand.name} avail.`, numeric: true },
  { key: "gaps", label: "Open gaps", numeric: true },
];

export default function StoreTable({ view }: { view: FilteredView }) {
  const [sort, setSort] = useState<SortKey>("availability");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const built = view.byPos.map((perf) => {
      const outlet = posOf(perf.posId)!;
      return {
        id: outlet.id,
        code: outlet.code,
        name: outlet.name,
        area: outlet.area,
        channel: outlet.channel,
        availability: perf.availability,
        client: perf.clientAvailability,
        gaps: perf.gaps,
      };
    });

    return built.sort((a, b) => {
      const dir = asc ? 1 : -1;
      const av = a[sort];
      const bv = b[sort];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [sort, asc, view]);

  const toggle = (key: SortKey) => {
    if (key === sort) {
      setAsc((v) => !v);
      return;
    }
    setSort(key);
    setAsc(key === "availability" || key === "client");
  };

  return (
    <div className="max-h-[520px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink-400">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-2.5 font-semibold ${col.numeric ? "text-right" : "text-left"}`}
                aria-sort={
                  sort === col.key ? (asc ? "ascending" : "descending") : "none"
                }
              >
                <button
                  type="button"
                  onClick={() => toggle(col.key)}
                  className={`inline-flex items-center gap-1 transition-colors hover:text-ink-900 ${
                    sort === col.key ? "text-ink-900" : ""
                  }`}
                >
                  {col.label}
                  {sort === col.key && (
                    <span aria-hidden className="text-[10px]">
                      {asc ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line last:border-0">
              <td className="px-5 py-2.5">
                <OutletButton posId={row.id} />
                {row.name && (
                  <span className="block text-[12px] text-ink-400">{row.name}</span>
                )}
              </td>
              <td className="px-5 py-2.5 text-ink-700">{row.area}</td>
              <td className="px-5 py-2.5 text-ink-500">{row.channel}</td>
              <td className="mono px-5 py-2.5 text-right text-ink-700">
                {row.availability}%
              </td>
              <td className="mono px-5 py-2.5 text-right font-semibold text-ink-900">
                {row.client}%
              </td>
              <td className="mono px-5 py-2.5 text-right">
                {row.gaps === 0 ? (
                  <span className="text-ink-400">—</span>
                ) : (
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-critical)" }}
                  >
                    {row.gaps}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-5 py-8 text-center text-ink-400">
                No outlets match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
