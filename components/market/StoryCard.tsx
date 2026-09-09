"use client";

/* SECTION C · a market story.

   Headline, one number, one chart, one recommendation — and, folded
   away, the TEST the story had to pass to appear at all. A reader who
   disagrees with the narrative can check its condition instead of
   arguing with the prose, which is the difference between a story and
   a claim. */

import { useState } from "react";
import Link from "next/link";
import type { Story } from "@/lib/market/stories";
import { RankedBars } from "./charts";
import Bar from "./ui/Bar";

export default function StoryCard({ story }: { story: Story }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)]">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0 p-4 sm:p-5">
          <h3 className="font-display text-[18px] font-bold leading-tight tracking-tight text-ink-900">
            {story.headline}
          </h3>

          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-[30px] font-bold leading-none tracking-tight text-violet-ink">
              {story.figure.value}
            </span>
            <span className="text-[12.5px] leading-snug text-ink-500">{story.figure.label}</span>
          </p>

          <p className="mt-3 max-w-[62ch] text-[12.5px] leading-relaxed text-ink-700">
            {story.body}
          </p>

          <div className="mt-3.5 rounded-[10px] border border-violet-100 bg-violet-050 px-3 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-violet-ink">
              Recommendation
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink-900">
              {story.recommendation}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={story.cta.href}
              className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
            >
              {story.cta.label}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="text-[12px] font-semibold text-ink-500 transition-colors hover:text-ink-900"
            >
              {open ? "Hide the test" : "Why is this a story?"}
            </button>
          </div>

          {open && (
            <p className="mono mt-2.5 border-t border-line pt-2.5 text-[11px] leading-snug text-ink-500">
              This block appears only when: {story.test}
            </p>
          )}
        </div>

        <div className="min-w-0 border-t border-line bg-canvas p-4 sm:p-5 lg:border-l lg:border-t-0">
          {story.chart.kind === "bars" ? (
            <RankedBars
              rows={story.chart.rows}
              unit={story.chart.unit}
              max={story.chart.max}
              par={story.chart.par}
            />
          ) : (
            <PairChart chart={story.chart} />
          )}
        </div>
      </div>
    </article>
  );
}

/* The paired-comparison chart, pulled out so TypeScript can narrow the
   union once rather than at every field access. */
function PairChart({
  chart,
}: {
  chart: Extract<Story["chart"], { kind: "trend" }>;
}) {
  return (
    <ul className="flex flex-col gap-3.5">
      {chart.rows.map((row) => (
        <li key={row.label}>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">
            {row.label}
          </p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <PairRow
              label={chart.aLabel}
              value={row.a}
              max={Math.max(row.a, row.b) * 1.15}
              unit={chart.unit}
              emphasis
            />
            <PairRow
              label={chart.bLabel}
              value={row.b}
              max={Math.max(row.a, row.b) * 1.15}
              unit={chart.unit}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PairRow({
  label, value, max, unit, emphasis,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[92px] shrink-0 truncate text-[11.5px] text-ink-500">{label}</span>
      <Bar
        value={value}
        max={max}
        color={emphasis ? "var(--color-violet)" : "var(--color-comp-1)"}
        label={`${label}: ${value}${unit}`}
      />
      <span className="mono w-[46px] shrink-0 text-right text-[12px] font-semibold text-ink-900">
        {value}
        {unit}
      </span>
    </div>
  );
}
