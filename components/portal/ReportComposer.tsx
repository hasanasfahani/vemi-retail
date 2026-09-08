"use client";

/* The report, assembled by the person sending it.

   Command Center and the Digest both decide for the reader what they
   see. A report is different in one specific way: someone is putting
   their name on it and forwarding it to a board, and what belongs in
   that document depends on the audience — a supply review wants the
   gaps and the route, an investor update wants the standing and the
   method, and nobody wants all of it. So the sections are choices, and
   the choice travels in the URL, which means a forwarded link opens
   the same document rather than the sender's defaults.

   The sections themselves are rendered on the server and handed here
   as nodes. This component owns which of them are shown and nothing
   about what they contain — so the report can never disagree with the
   page it was cut from. */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ReportSection = {
  id: string;
  label: string;
  /* What this section is for, shown beside its checkbox — the sender
     is choosing for an audience, not toggling widgets. */
  hint: string;
  node: ReactNode;
  /* Sections that make the document legible at all. They can still be
     dropped, but they start on for everyone. */
  core?: boolean;
};

export default function ReportComposer({
  sections,
  children,
}: {
  sections: ReportSection[];
  /* The cover, always printed. */
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const allIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const defaults = useMemo(
    () => sections.filter((s) => s.core !== false).map((s) => s.id),
    [sections]
  );

  /* The URL is the source of truth, so a link someone forwards opens
     their selection and not the recipient's. An absent parameter means
     "the default report", not "an empty one". */
  const chosen = useMemo(() => {
    const raw = params.get("sections");
    if (raw === null) return new Set(defaults);
    return new Set(raw.split(",").filter((id) => allIds.includes(id)));
  }, [params, defaults, allIds]);

  const write = useCallback(
    (next: Set<string>) => {
      const ordered = allIds.filter((id) => next.has(id));
      const q = new URLSearchParams(params.toString());
      q.set("sections", ordered.join(","));
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [allIds, params, pathname, router]
  );

  const toggle = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
  };

  const [copied, setCopied] = useState<"link" | null>(null);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("link");
    } catch {
      /* Clipboard is permission-gated and the address bar already has
         the link — a failed copy is not worth an error state. */
    }
  };

  const shown = sections.filter((s) => chosen.has(s.id));

  return (
    <>
      {/* the builder — screen only; it is the tool, not the document */}
      <section className="mb-5 rounded-[18px] border border-line bg-white p-5 sm:p-6 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="t-h3 !text-[15px]">What goes in this report</h2>
            <p className="mt-1 text-[13px] text-ink-500">
              {shown.length} of {sections.length} sections. Your selection is in
              the address — send the link and the recipient opens this exact
              document.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={copyLink} className="btn-ghost !py-2 text-sm">
              {copied === "link" ? "Link copied ✓" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary !py-2 text-sm"
            >
              Print / save as PDF
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {sections.map((section) => {
            const on = chosen.has(section.id);
            return (
              <label
                key={section.id}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas"
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(section.id)}
                  className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--color-violet)]"
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink-900">
                    {section.label}
                  </span>
                  <span className="block text-[12px] leading-snug text-ink-500">
                    {section.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {shown.length === 0 && (
          <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-500">
            Nothing selected — the report is just its cover. Tick at least one
            section above.
          </p>
        )}
      </section>

      {/* the document */}
      <div className="report-doc flex flex-col gap-4">
        {children}
        {shown.map((section) => (
          <div key={section.id} className="report-block">
            {section.node}
          </div>
        ))}
      </div>
    </>
  );
}
