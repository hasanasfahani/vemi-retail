"use client";

import { motion, useReducedMotion } from "framer-motion";
import { gap } from "@/lib/v2Content";
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";

/* The section's whole argument in one small chart card: what the
   paperwork claims (Slate), what the shelf shows (Violet), and the
   distance between them, outlined in Ink rather than painted red.
   Figures are illustrative and say so. */

const w = gap.widget;
const delta = w.reportedValue - w.actualValue;

function Row({
  label,
  value,
  color,
  strong,
  delay,
  children,
}: {
  label: string;
  value: number;
  color: string;
  strong?: boolean;
  delay: number;
  children?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className={`text-sm ${strong ? "font-semibold text-ink-900" : "text-ink-500"}`}>{label}</span>
        <span className="font-mono text-sm font-medium text-ink-900">{value}%</span>
      </div>
      <div className="relative h-4 rounded-sm bg-line/60">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-sm"
          initial={reduceMotion ? false : { width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: color }}
        />
        {children}
      </div>
    </div>
  );
}

export default function GapWidget() {
  return (
    <section className="vm-card flex flex-col gap-6" aria-label={w.eyebrow}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[22px] font-semibold leading-7 text-ink-900">Reported vs actual</h3>
        <ConfidenceBadge level="estimated" size="sm">Sample figure</ConfidenceBadge>
      </header>

      <p className="vm-chartcard__sowhat">
        Of {w.reportedValue}% reported distribution, Vemi could verify {w.actualValue}% on the
        shelf. {delta} points exist only on paper.
      </p>

      <div className="flex flex-col gap-5">
        <Row label={w.reportedLabel} value={w.reportedValue} color="var(--vm-chart-3)" delay={0} />
        <Row label={w.actualLabel} value={w.actualValue} color="var(--vm-chart-1)" strong delay={0.12}>
          {/* the unverified remainder, outlined */}
          <span
            aria-hidden
            className="absolute inset-y-0 rounded-sm border-2 border-dashed border-ink-900"
            style={{ left: `${w.actualValue}%`, width: `${delta}%` }}
          />
        </Row>
      </div>

      <footer className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
        <span className="tnum text-[36px] leading-10">{delta} pts</span>
        <p className="min-w-0 flex-1 text-sm text-ink-700">
          <span className="font-semibold text-ink-900">{w.gapLabel}.</span> {w.gapBody}
        </p>
        <span className="w-full font-mono text-xs text-ink-500">{w.tag}</span>
      </footer>
    </section>
  );
}
