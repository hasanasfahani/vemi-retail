import type { ReactNode } from "react";
import { cx } from "./cx";
import { ConfidenceBadge, type Confidence } from "./ConfidenceBadge";

/**
 * Every chart lives in a ChartCard. `soWhat` (the finding, one sentence)
 * and `howToRead` are required so an unexplained chart cannot ship; both
 * should be computed from the same data the chart draws.
 */
export function ChartCard({
  title, soWhat, howToRead, asOf, base, confidence, actions, alert, children, className, id, table,
}: {
  title: string;
  soWhat: ReactNode;
  howToRead: ReactNode;
  asOf?: string;
  base?: string;
  confidence?: Confidence;
  actions?: ReactNode;
  alert?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  /** The chart's numbers as a table (brand charts.md: a data table is
      always available). Rendered behind a "View as table" disclosure. */
  table?: { columns: string[]; rows: (string | number)[][]; numeric?: boolean[] };
}) {
  const foot = [asOf, base].filter(Boolean).join(" · ");
  return (
    <section id={id} className={cx("vm-card vm-chartcard", className)} aria-label={title}>
      <header className="vm-chartcard__head">
        <div className="vm-chartcard__titles">
          <h2 className="vm-chartcard__title">{title}</h2>
          {confidence && <ConfidenceBadge level={confidence} size="sm" />}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {alert && <div>{alert}</div>}
      <p className="vm-chartcard__sowhat">{soWhat}</p>
      <div className="vm-chartcard__body">{children}</div>
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
      <footer className="vm-chartcard__foot">
        <details className="vm-chartcard__how">
          <summary>How to read this</summary>
          <p>{howToRead}</p>
        </details>
        {foot && <span className="vm-chartcard__asof">{foot}</span>}
      </footer>
    </section>
  );
}
