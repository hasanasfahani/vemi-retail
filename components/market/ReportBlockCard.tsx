"use client";

/* One block on a report.

   The card is the same one every other page uses, so a block looks
   like what it looked like where the reader first met it. The only
   thing added is the SCOPE CHIP, and it is the reason this component
   exists at all.

   Every other page in this portal obeys one rule: one filter bar, one
   slice, every figure computed over it. A report breaks that on
   purpose — comparing Baghdad against Basra side by side cannot be
   said any other way. So the rule is replaced rather than abandoned: a
   block computed over anything other than the header states it on its
   own face, where the figure is, not in a settings panel nobody has
   open. Silence means "the bar above". */

import { useMemo, type ReactNode } from "react";
import { Card } from "./ui";
import { applyFilters } from "@/lib/market/filters";
import { hasScope, resolveScope, type ReportBlock } from "@/lib/market/reports";
import { BLOCK_BY_ID, scopeForBlock } from "@/lib/market/reportBlocks";
import { FILTER_KEYS, FILTER_META, type Filters } from "@/lib/market/filters";
import { channelName, governorateName, monthLabel, brands, skuOf } from "@/lib/market";
import type { MonthData } from "@/lib/market/types";
import type { Targets } from "@/lib/market/settings";

/* The override in the reader's words. Names, not ids — a chip reading
   "governorates: basra" is a database row, not a sentence. */
function describeScope(block: ReportBlock): string[] {
  const scope = block.scope;
  if (!hasScope(scope)) return [];
  const out: string[] = [];
  if (scope!.month) out.push(monthLabel(scope!.month));
  for (const key of FILTER_KEYS) {
    const held = scope![key];
    if (!held?.length) continue;
    const named = held.map((value) =>
      key === "governorates" ? governorateName(value)
      : key === "channels" ? channelName(value)
      : key === "brands" ? brands.find((b) => b.id === value)?.name ?? value
      : key === "skus" ? skuOf(value)?.name ?? value
      : value
    );
    out.push(named.length > 2 ? `${named.length} ${FILTER_META[key].noun}` : named.join(", "));
  }
  return out;
}

export default function ReportBlockCard({
  block,
  headerFilters,
  data,
  targets,
  action,
}: {
  block: ReportBlock;
  /* The report's scope — the global bar. Blocks inherit it. */
  headerFilters: Filters;
  data: MonthData;
  targets: Targets;
  /* The settings control, supplied by the page so this component stays
     a renderer. */
  action?: ReactNode;
}) {
  const def = BLOCK_BY_ID.get(block.blockId);

  /* Two steps, in this order. The block's own overrides replace the
     header's dimensions; then the catalogue decides whether this
     particular block may see a brand filter at all. */
  const view = useMemo(() => {
    if (!def) return null;
    return applyFilters(scopeForBlock(def, resolveScope(headerFilters, block.scope)), data);
  }, [def, headerFilters, block.scope, data]);

  if (!def) {
    /* A share link naming a block this build no longer has. Saying so
       beats a gap the reader has to guess at. */
    return (
      <Card title="This block is no longer available">
        <p className="text-[12.5px] leading-snug text-ink-500">
          The report asks for <code className="mono">{block.blockId}</code>, which this version of
          the portal does not offer. Remove it, or open the report where it was made.
        </p>
      </Card>
    );
  }

  const chips = describeScope(block);
  /* A brand-comparison block cannot honour a brand override, and the
     chip must not claim it did. */
  const dropped =
    def.ignoresBrandFilter && (block.scope?.brands?.length || block.scope?.skus?.length);

  return (
    <Card
      title={block.title ?? def.label}
      lead={def.lead}
      action={
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-violet-100 bg-violet-050 px-2 py-[2px] text-[10.5px] font-semibold text-violet-ink"
            >
              {chip}
            </span>
          ))}
          {action}
        </span>
      }
      footnote={
        dropped ? (
          <>
            {def.footnote ? <>{def.footnote} </> : null}
            This block compares every brand, so the brand and SKU part of its scope does not apply
            to it — a comparison with five of six brands removed is not a comparison.
          </>
        ) : (
          def.footnote
        )
      }
    >
      {view ? def.render({ view, targets }) : null}
    </Card>
  );
}
