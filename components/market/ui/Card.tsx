/* The one panel. Every block of content on every page sits in one of
   these, so the portal has a single edge, a single radius and a single
   internal rhythm rather than a per-page interpretation of "card".

   Header parts are optional and independently omitted: a chart panel
   usually wants a title and an action, a table panel often wants only
   the title, and a bare figure wants neither. */

import type { ReactNode } from "react";

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
  /* Tables draw their own edges, so they opt out of body padding. */
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const head = title || lead || action;
  return (
    <section
      className={`rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)] ${className}`}
    >
      {/* The header wraps rather than competes: a six-brand legend in
          the action slot squeezed "Shelf battle by city" into 76px and
          four lines of type, so below a certain width the action drops
          to its own row instead. */}
      {head && (
        <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pb-3 pt-3.5 sm:px-5">
          <div className="min-w-[210px] flex-1">
            {title && (
              <h2 className="font-display text-[14.5px] font-bold tracking-tight text-ink-900">
                {title}
              </h2>
            )}
            {lead && (
              <p className="mt-0.5 max-w-[68ch] text-[12.5px] leading-snug text-ink-500">
                {lead}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 empty:hidden">{action}</div>}
        </header>
      )}
      <div className={padded ? `px-4 sm:px-5 ${head ? "pb-4" : "py-4"}` : ""}>
        {children}
      </div>
      {footnote && (
        <p className="border-t border-line px-4 py-2.5 text-[11.5px] leading-snug text-ink-400 sm:px-5">
          {footnote}
        </p>
      )}
    </section>
  );
}
