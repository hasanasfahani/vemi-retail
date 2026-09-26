/* The one panel, now the brand card: white, 1px Line, radius 16, 24px
   padding, 22px title. Every block of content on every page sits in one
   of these, so the portal has a single edge and a single rhythm.

   Given a `soWhat`, the card becomes the brand's ChartCard: the finding
   (one sentence, computed from the same data the chart draws) sits under
   the title at 18px, and the footnote moves into a "How to read this"
   disclosure beside the as-of line. Every chart in the portal is shown
   this way, so no chart ships without saying what it found.

   Header parts are optional and independently omitted. `padded={false}`
   lets a table or map draw its own edges. */

import type { ReactNode } from "react";
import { cx } from "@/components/vemi/cx";
import { ConfidenceBadge, type Confidence } from "@/components/vemi/ConfidenceBadge";

export default function Card({
  title,
  lead,
  action,
  footnote,
  soWhat,
  asOf,
  base,
  confidence,
  table,
  padded = true,
  className = "",
  id,
  children,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /* Provenance, thresholds, "measured over N outlets" — the line that
     keeps a figure honest. Always rendered when given; with a soWhat it
     becomes "How to read this". */
  footnote?: ReactNode;
  /* The finding, one sentence: what the chart shows, not what it is. */
  soWhat?: ReactNode;
  asOf?: string;
  base?: string;
  confidence?: Confidence;
  /* The chart's numbers as a table (brand: a data table is always
     available for a chart). */
  table?: { columns: string[]; rows: (string | number)[][]; numeric?: boolean[] };
  padded?: boolean;
  className?: string;
  id?: string;
  children?: ReactNode;
}) {
  const head = title || lead || action || soWhat;
  const basis = [asOf, base].filter(Boolean).join(" · ");
  const chart = Boolean(soWhat);
  const pad = "px-5 sm:px-6";

  return (
    <section id={id} className={cx("min-w-0 rounded-lg border border-line bg-white", className)}>
      {/* The header wraps rather than competes: a wide legend in the
          action slot drops to its own row instead of squeezing the title. */}
      {head && (
        <header className={cx("flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pt-5 sm:pt-6", pad)}>
          <div className="min-w-[200px] flex-1">
            {title && (
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[22px] font-semibold leading-7 text-ink-900">{title}</h2>
                {confidence && <ConfidenceBadge level={confidence} size="sm" />}
              </div>
            )}
            {lead && <p className="mt-1 max-w-[72ch] text-sm text-ink-500">{lead}</p>}
            {soWhat && <p className="vm-chartcard__sowhat mt-3">{soWhat}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2 empty:hidden">{action}</div>}
        </header>
      )}
      <div className={padded ? cx(pad, "pb-5 sm:pb-6", head ? "pt-4" : "pt-5 sm:pt-6") : head ? "pt-4" : ""}>
        {children}
      </div>

      {chart ? (
        (footnote || basis || table) && (
          <footer className={cx("flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-t border-line py-3", pad)}>
            <div className="flex min-w-0 flex-col gap-2">
              {footnote && (
                <details className="vm-chartcard__how">
                  <summary>How to read this</summary>
                  <p>{footnote}</p>
                </details>
              )}
              {table && (
                <details className="vm-chartcard__how">
                  <summary>View as table</summary>
                  <div className="mt-2 overflow-x-auto">
                    <table className="vm-table">
                      <thead>
                        <tr>
                          {table.columns.map((c, i) => (
                            <th key={c} className={table.numeric?.[i] ? "num" : undefined}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((r, ri) => (
                          <tr key={ri}>
                            {r.map((v, i) => (
                              <td key={i} className={table.numeric?.[i] ? "num" : undefined}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
            {basis && <span className="vm-chartcard__asof">{basis}</span>}
          </footer>
        )
      ) : (
        footnote && (
          <p className={cx("border-t border-line py-3 text-xs leading-[18px] text-ink-500", pad)}>{footnote}</p>
        )
      )}
    </section>
  );
}
