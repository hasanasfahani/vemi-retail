"use client";

/* The one table.

   POS Explorer, Performance, Competition, Action Center and Reports all
   render lists of the same shape — an entity, some measures, a state —
   and each of them used to be a chance to invent sorting again. This is
   the shared answer: sort, search, paginate, export, and click a row
   through to its detail.

   Columns declare `sortValue` separately from `render`, because what a
   cell shows (a badge, a bar, a formatted rate) is rarely what it
   should sort by, and `csv` separately again, because a CSV of React
   nodes is useless.

   Column visibility is deliberately configurable in code and NOT
   exposed in the UI: `hidden` lets a page ship a column it doesn't
   want yet without a control nobody asked for. */

import { useMemo, useState, type ReactNode } from "react";
import EmptyState from "./EmptyState";

/* A column the reader can narrow by. Search finds one row; a facet
   answers "show me only Basra" — a different act, and one a
   twelve-row page of outliers needs before search is any use. */
export type Facet<T> = {
  id: string;
  label: string;
  /* The value this row falls under. Options are built from the rows
     themselves, so a facet can never offer a filter that matches
     nothing. */
  value: (row: T) => string;
};

export type Column<T> = {
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /* Omit to make the column unsortable. */
  sortValue?: (row: T) => number | string;
  /* Falls back to sortValue, then to nothing. */
  csv?: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
  hidden?: boolean;
};

export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchable,
  searchPlaceholder = "Search…",
  searchText,
  facets,
  pageSize = 25,
  defaultSort,
  onRowClick,
  exportName,
  empty,
  dense,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /* Per-table search — page-local by design, never in the URL. */
  searchable?: boolean;
  searchPlaceholder?: string;
  searchText?: (row: T) => string;
  /* Dropdowns above the table, one per faceted column. */
  facets?: Facet<T>[];
  pageSize?: number;
  defaultSort?: { id: string; dir: "asc" | "desc" };
  onRowClick?: (row: T) => void;
  /* Given, a Download CSV button appears and writes `<name>.csv`. */
  exportName?: string;
  empty?: { title: string; lead?: string };
  dense?: boolean;
}) {
  const cols = useMemo(() => columns.filter((c) => !c.hidden), [columns]);
  const [sort, setSort] = useState(defaultSort ?? null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});

  /* Options come from the rows in hand, sorted, so the dropdown can
     never offer a value that filters everything away. */
  const facetOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const facet of facets ?? []) {
      out[facet.id] = [...new Set(rows.map((r) => facet.value(r)).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      );
    }
    return out;
  }, [rows, facets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      for (const facet of facets ?? []) {
        const want = picked[facet.id];
        if (want && facet.value(row) !== want) return false;
      }
      if (!q || !searchText) return true;
      return searchText(row).toLowerCase().includes(q);
    });
  }, [rows, query, searchText, facets, picked]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = cols.find((c) => c.id === sort.id);
    if (!col?.sortValue) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, cols]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const shown = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setPage(0);
    setSort((s) =>
      s?.id === col.id
        ? { id: col.id, dir: s.dir === "asc" ? "desc" : "asc" }
        : { id: col.id, dir: "desc" }
    );
  };

  /* The export follows the view: whatever is sorted and searched is
     what lands in the file, because a download that silently differs
     from the screen is a bug report waiting to happen. */
  const download = () => {
    const cell = (row: T, col: Column<T>) => {
      const raw = col.csv?.(row) ?? col.sortValue?.(row) ?? "";
      const text = String(raw);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const head = cols.map((c) => (typeof c.header === "string" ? c.header : c.id));
    const body = sorted.map((r) => cols.map((c) => cell(r, c)).join(","));
    const blob = new Blob([[head.join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pad = dense ? "px-3 py-1.5" : "px-3 py-2.5";

  return (
    <div className="min-w-0">
      {(searchable || exportName || (facets && facets.length > 0)) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          {searchable && searchText ? (
            <label className="relative min-w-0 flex-1 sm:max-w-[280px]">
              <span className="sr-only">{searchPlaceholder}</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-[9px] border border-line-strong bg-white py-1.5 pl-7 pr-2.5 text-[12.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-violet"
              />
              <svg viewBox="0 0 16 16" className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
            </label>
          ) : null}

          {(facets ?? []).map((facet) => (
            <label key={facet.id} className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {facet.label}
              </span>
              <select
                value={picked[facet.id] ?? ""}
                onChange={(e) => {
                  setPicked((held) => ({ ...held, [facet.id]: e.target.value }));
                  setPage(0);
                }}
                className={`rounded-[8px] border bg-white px-2 py-1 text-[12px] outline-none transition-colors ${
                  picked[facet.id]
                    ? "border-violet-100 bg-violet-050 font-semibold text-violet-ink"
                    : "border-line-strong text-ink-700 hover:border-ink-400"
                }`}
              >
                <option value="">All</option>
                {(facetOptions[facet.id] ?? []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}

          {Object.values(picked).some(Boolean) && (
            <button
              type="button"
              onClick={() => {
                setPicked({});
                setPage(0);
              }}
              className="text-[12px] font-semibold text-violet-ink hover:underline"
            >
              Clear
            </button>
          )}

          <span className="ml-auto" />
          {exportName && (
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-1.5 rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 12.5h10" />
              </svg>
              CSV
            </button>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState
          title={empty?.title ?? "Nothing in this view"}
          lead={
            empty?.lead ??
            "No rows match the current filters. Widen the scope, or clear the search above."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line">
                {cols.map((col) => {
                  const on = sort?.id === col.id;
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      style={col.width ? { width: col.width } : undefined}
                      className={`${pad} text-[11px] font-semibold uppercase tracking-wide text-ink-400 ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                      aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    >
                      {col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col)}
                          className={`inline-flex items-center gap-1 transition-colors hover:text-ink-700 ${
                            on ? "text-ink-700" : ""
                          }`}
                        >
                          {col.header}
                          <span aria-hidden className={on ? "" : "opacity-0"}>
                            {on && sort!.dir === "asc" ? "▲" : "▼"}
                          </span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter") onRowClick(row);
                        }
                      : undefined
                  }
                  className={`border-b border-line last:border-0 ${
                    onRowClick ? "cursor-pointer transition-colors hover:bg-canvas" : ""
                  }`}
                >
                  {cols.map((col) => (
                    <td
                      key={col.id}
                      className={`${pad} align-middle text-ink-700 ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
          <span className="mono text-[11.5px] text-ink-400">
            {(current * pageSize + 1).toLocaleString()}–
            {Math.min(sorted.length, (current + 1) * pageSize).toLocaleString()} of{" "}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <PageButton label="Previous" disabled={current === 0} onClick={() => setPage(current - 1)} />
            <span className="mono px-1 text-[11.5px] text-ink-500">
              {current + 1} / {pages}
            </span>
            <PageButton label="Next" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PageButton({
  label, disabled, onClick,
}: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-[8px] border border-line-strong bg-white px-2 py-1 text-[11.5px] font-semibold text-ink-700 transition-colors hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}
