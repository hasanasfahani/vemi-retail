"use client";

/* SECTION B · one opportunity, ranked by what it is worth.

   Money is the only unit every finding can be ranked in, and it is
   modelled rather than measured — so the card carries the assumption
   with the figure, every time, not in a footnote somewhere else on the
   page. A dinar number that travels without its basis is the one thing
   that would make this page untrustworthy. */

import Link from "next/link";
import type { Insight } from "@/lib/market/insights";
import { CATEGORY_LABEL } from "@/lib/market/insights";
import { formatIqd, impactAssumptionShort } from "@/lib/market/economics";
import { governorateName } from "@/lib/market";
import Badge from "./ui/Badge";
import Bar from "./ui/Bar";
import type { Band } from "./ui/health";

const SEVERITY_BAND: Record<Insight["severity"], Band> = {
  critical: "critical",
  warning: "attention",
  watch: "average",
};

export default function OpportunityCard({
  insight,
  rank,
  max,
}: {
  insight: Insight;
  rank: number;
  /* The largest money figure in the list, so the bars share a scale
     and the ranking is visible rather than implied. */
  max: number;
}) {
  return (
    <article className="flex min-w-0 gap-3.5 rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <span className="mono mt-0.5 shrink-0 text-[13px] font-semibold text-ink-400">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            band={SEVERITY_BAND[insight.severity]}
            label={CATEGORY_LABEL[insight.category]}
            size="sm"
          />
          <span className="mono text-[11px] text-ink-400">
            {insight.scope.outlets.toLocaleString()}{" "}
            {insight.scope.outlets === 1 ? "outlet" : "outlets"}
          </span>
          {insight.concentration && (
            <span className="mono text-[11px] text-ink-400">
              · {insight.concentration.share}% in {governorateName(insight.concentration.governorateId)}
            </span>
          )}
        </div>

        <h3 className="mt-1.5 font-display text-[14px] font-bold leading-snug tracking-tight text-ink-900">
          {insight.headline}
        </h3>

        <div className="mt-2 flex items-center gap-2.5">
          <Bar
            value={insight.money ?? 0}
            max={max || 1}
            color="var(--color-violet)"
            label={`${insight.headline}: ${insight.money ?? 0} IQD`}
          />
          <span className="mono shrink-0 text-[13px] font-semibold text-ink-900">
            {insight.money === null ? "—" : `${formatIqd(insight.money)} IQD`}
          </span>
        </div>

        <dl className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11.5px]">
          <div className="flex gap-1.5">
            <dt className="text-ink-400">Confidence</dt>
            <dd className="font-semibold text-ink-700">
              {insight.confidence === "measured" ? "Counted" : "Projected"}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ink-400">Basis</dt>
            <dd className="text-ink-700">{insight.impact.label}</dd>
          </div>
        </dl>

        <p className="mt-2 text-[11px] leading-snug text-ink-400">{impactAssumptionShort}</p>

        <Link
          href={insight.cta.href}
          className="mt-2.5 inline-block rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
        >
          {insight.cta.label}
        </Link>
      </div>
    </article>
  );
}
