/* CSV, in one place.

   Two components had grown their own copy of this — the same quoting
   rule, the same blob dance, the same filename convention — and a third
   was about to. The quoting is the part worth having once: a governorate
   called "Nineveh, Mosul" or a footnote containing a comma silently
   shifts every column to its right in a file nobody opens until the
   figures are already in a meeting. */

export type CsvTable = { columns: string[]; rows: (string | number)[][] };

const cell = (value: string | number): string => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsvText(table: CsvTable): string {
  return [table.columns, ...table.rows].map((row) => row.map(cell).join(",")).join("\n");
}

export function downloadCsv(name: string, table: CsvTable): void {
  /* A BOM, because Excel opens UTF-8 without one as Latin-1 and every
     Arabic outlet name arrives as mojibake. */
  const blob = new Blob([`﻿${toCsvText(table)}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* Filenames that sort and survive a filesystem. */
export const csvName = (...parts: (string | undefined)[]): string =>
  parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "vemi-export";
