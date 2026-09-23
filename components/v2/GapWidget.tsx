"use client";

import { motion, useReducedMotion } from "framer-motion";
import { gap } from "@/lib/v2Content";
import { Figure } from "@/components/v2/Figure";

/* The section's whole argument in one figure: what the paperwork claims,
   what the shelf actually shows, and the hatched distance between them. */

const w = gap.widget;
const delta = w.reportedValue - w.actualValue;

export default function GapWidget() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="t-eyebrow">{w.eyebrow}</span>
        <span className="chip !py-1 text-xs">
          <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
          {w.tag}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* the claim */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink-500">{w.reportedLabel}</span>
            <span className="tnum !text-sm text-ink-500">
              <Figure value={`${w.reportedValue}%`} />
            </span>
          </div>
          <div className="h-3.5 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full"
              initial={reduceMotion ? false : { width: 0 }}
              whileInView={{ width: `${w.reportedValue}%` }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "var(--color-line-strong)" }}
            />
          </div>
        </div>

        {/* the truth, with the unverified remainder exposed */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink-900">{w.actualLabel}</span>
            <span className="tnum !text-sm" style={{ color: "var(--color-violet-ink)" }}>
              <Figure value={`${w.actualValue}%`} />
            </span>
          </div>
          <div className="relative h-3.5 overflow-hidden rounded-full bg-line">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              initial={reduceMotion ? false : { width: 0 }}
              whileInView={{ width: `${w.actualValue}%` }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "var(--color-violet)" }}
            />
            <motion.div
              className="absolute inset-y-0"
              initial={reduceMotion ? false : { width: 0 }}
              whileInView={{ width: `${delta}%` }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.55, delay: 0.82, ease: [0.22, 1, 0.36, 1] }}
              style={{
                left: `${w.actualValue}%`,
              }}
            >
              <motion.span
                className="absolute inset-0"
                aria-hidden="true"
                animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "16px 0px"] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{
                  background:
                    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-critical) 34%, #fff) 0 4px, color-mix(in srgb, var(--color-critical) 14%, #fff) 4px 8px)",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-xl border border-line bg-canvas p-4">
        <span className="tnum shrink-0 text-4xl" style={{ color: "var(--color-critical)" }}>
          {delta}%
        </span>
        <p className="text-sm leading-snug text-ink-700">
          <span className="font-semibold text-ink-900">{w.gapLabel}</span> — {w.gapBody}
        </p>
      </div>
    </div>
  );
}
