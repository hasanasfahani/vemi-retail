/* A section of a portal page: the brand's section title (32/40), one
   sentence on what it answers, and its controls at the end. Keeps every
   page's rhythm the same: PageHeader → sections → cards. */

import type { ReactNode } from "react";

export default function SectionHead({
  title,
  lead,
  actions,
  id,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 id={id} className="vm-h2 text-text">
          {title}
        </h2>
        {lead && <p className="mt-1 max-w-[72ch] text-base text-text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
