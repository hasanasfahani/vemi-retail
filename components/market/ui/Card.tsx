/* The one panel, now the brand card: white, 1px Line, radius 16, 24px
   padding, 22px title. Every block of content on every page sits in one
   of these, so the portal has a single edge and a single rhythm.

   Header parts are optional and independently omitted. `padded={false}`
   lets a table or map draw its own edges. */

import type { ReactNode } from "react";
import { cx } from "@/components/vemi/cx";

export default function Card({
  title,
  lead,
  action,
  footnote,
  padded = true,
  className = "",
  children,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /* Provenance, thresholds, "measured over N outlets" — the line that
     keeps a figure honest. Always rendered when given. */
  footnote?: ReactNode;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const head = title || lead || action;
  return (
    <section className={cx("min-w-0 rounded-lg border border-line bg-white", className)}>
      {/* The header wraps rather than competes: a wide legend in the
          action slot drops to its own row instead of squeezing the title. */}
      {head && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-[200px] flex-1">
            {title && <h2 className="text-[22px] font-semibold leading-7 text-ink-900">{title}</h2>}
            {lead && <p className="mt-1 max-w-[72ch] text-sm text-ink-500">{lead}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2 empty:hidden">{action}</div>}
        </header>
      )}
      <div className={padded ? cx("px-5 pb-5 sm:px-6 sm:pb-6", head ? "pt-4" : "pt-5 sm:pt-6") : head ? "pt-4" : ""}>
        {children}
      </div>
      {footnote && (
        <p className="border-t border-line px-5 py-3 text-xs leading-[18px] text-ink-500 sm:px-6">{footnote}</p>
      )}
    </section>
  );
}
