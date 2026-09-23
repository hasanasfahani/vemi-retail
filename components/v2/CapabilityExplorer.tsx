"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { retailAudit } from "@/lib/v2Content";
import Icon from "@/components/v2/Icon";
import Sparkline from "@/components/ui/Sparkline";
import PlanogramScene, { type SlotState } from "@/components/v2/PlanogramScene";

/* The eight retail-audit capabilities, each with a representative live
   widget. One preview at a time — the list stays scannable, the panel
   carries the proof. */

const caps = retailAudit.capabilities;
const comp = ["var(--color-comp-1)", "var(--color-comp-2)", "var(--color-comp-3)"];

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

function AnimatedFill({
  width,
  tone,
  delay = 0,
  className = "",
}: {
  width: string;
  tone: string;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { width: 0 }}
      whileInView={{ width }}
      viewport={{ once: true, amount: 0.65 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: tone }}
    />
  );
}

function ChartReveal({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Counts up from zero.

   requestAnimationFrame is paused entirely while a tab is hidden, so a
   pure rAF counter can render 0 forever on a page that loads in a
   background tab. A safety timer therefore lands the final value even
   when no frames are ever delivered. Both setState calls happen in
   async callbacks, never synchronously in the effect body. */
function CountUp({ to, durationMs = 1100 }: { to: number; durationMs?: number }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      const settle = setTimeout(() => setDisplay(to), 0);
      return () => clearTimeout(settle);
    }

    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(ease(t) * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* Frames may never arrive (hidden tab). Land on the real number. */
    const settle = setTimeout(() => setDisplay(to), durationMs + 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [to, durationMs, reduceMotion]);

  return <>{display}</>;
}

/* Visibility score as a sweeping arc. The preview panel remounts on every
   capability change, so the sweep replays each time Visibility is picked. */
function ScoreRing({ value, size = 104 }: { value: number; size?: number }) {
  const reduceMotion = useReducedMotion();
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-violet)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduceMotion ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-3xl" style={{ color: "var(--color-violet-ink)" }}>
          <CountUp to={value} />
        </span>
        <span className="text-[10px] text-ink-600">/ 100</span>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  scale,
  tone = "var(--color-violet)",
  strong,
  suffix = "%",
  delay = 0,
}: {
  label: string;
  value: number;
  scale: number;
  tone?: string;
  strong?: boolean;
  suffix?: string;
  delay?: number;
}) {
  return (
    <Row>
      <span className={`w-28 shrink-0 truncate text-xs ${strong ? "font-semibold text-ink-900" : "text-ink-500"}`}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded bg-line">
        <AnimatedFill
          className="h-full rounded"
          width={`${(value / scale) * 100}%`}
          tone={tone}
          delay={delay}
        />
      </div>
      <span className="tnum w-10 shrink-0 text-right text-xs">
        {value}
        {suffix}
      </span>
    </Row>
  );
}

function StatusPill({ tone, children }: { tone: "good" | "warn" | "critical"; children: React.ReactNode }) {
  const color = `var(--color-${tone === "good" ? "good" : tone === "warn" ? "warn" : "critical"})`;
  return (
    <span className={`pill pill-${tone}`}>
      <span className="dot" style={{ background: color }} />
      {children}
    </span>
  );
}

function Preview({ title }: { title: string }) {
  switch (title) {
    case "Availability & OOS":
      return (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <span className="t-eyebrow">On-shelf availability</span>
              <div className="tnum text-3xl">73%</div>
            </div>
            <ChartReveal>
              <Sparkline data={[66, 68, 67, 70, 71, 70, 72, 73]} />
            </ChartReveal>
          </div>
          <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded">
            <AnimatedFill className="h-full shrink-0" width="73%" tone="var(--color-violet)" />
            <AnimatedFill className="h-full shrink-0" width="15%" tone="var(--color-critical)" delay={0.16} />
            <AnimatedFill className="h-full shrink-0" width="12%" tone="var(--color-warn)" delay={0.28} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-violet)" }} />On shelf 73%</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-critical)" }} />Out of stock 15%</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-warn)" }} />Misplaced 12%</span>
          </div>
        </div>
      );

    case "Shelf Share & Facings":
      return (
        <div className="flex flex-col gap-2.5">
          {[
            { l: "Your brand", v: 28, s: true, t: "var(--color-violet)" },
            { l: "Competitor A", v: 22, t: comp[0] },
            { l: "Competitor B", v: 18, t: comp[1] },
            { l: "Competitor C", v: 12, t: comp[2] },
          ].map((b, index) => (
            <Bar key={b.l} label={b.l} value={b.v} scale={34} tone={b.t} strong={b.s} delay={index * 0.08} />
          ))}
          <p className="mt-1 text-xs text-ink-600">Linear share of the category shelf · 46 facings counted</p>
        </div>
      );

    case "Pricing":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-600">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 text-right font-medium">Shelf</th>
              <th className="pb-2 text-right font-medium">RRP</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "Cola 330ml", p: "750", r: "750", ok: true },
              { s: "Orange 330ml", p: "1,000", r: "900", ok: false },
              { s: "Water 500ml", p: "500", r: "500", ok: true },
            ].map((r) => (
              <tr key={r.s} className="border-b border-line last:border-0">
                <td className="py-2 font-medium text-ink-900">{r.s}</td>
                <td className="mono py-2 text-right text-ink-700">{r.p}</td>
                <td className="mono py-2 text-right text-ink-500">{r.r}</td>
                <td className="py-2 text-right">
                  {r.ok ? <StatusPill tone="good">At RRP</StatusPill> : <StatusPill tone="warn">+11%</StatusPill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "Visibility":
      return (
        <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto flex flex-col items-center sm:mx-0">
            <ScoreRing value={68} />
            <div className="mt-2 text-center text-xs text-ink-600">Visibility score</div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { p: "Eye-level", v: 42, prime: true },
              { p: "End-cap", v: 12, prime: true },
              { p: "Mid-shelf", v: 30, prime: false },
              { p: "Bottom", v: 16, prime: false },
            ].map((x, index) => (
              <Row key={x.p}>
                <span className={`w-20 shrink-0 text-xs ${x.prime ? "font-semibold text-ink-900" : "text-ink-500"}`}>
                  {x.p}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-line">
                  <AnimatedFill
                    className="h-full rounded"
                    width={`${x.v}%`}
                    tone={x.prime ? "var(--color-violet)" : "var(--color-comp-1)"}
                    delay={index * 0.08}
                  />
                </div>
                <span className="tnum w-8 shrink-0 text-right text-xs">{x.v}%</span>
              </Row>
            ))}
            <p className="mt-1 text-xs text-ink-600">
              <span className="font-semibold text-ink-700">54%</span> of your facings sit in prime
              positions · 46 facings counted
            </p>
          </div>
        </div>
      );

    case "Planogram Compliance": {
      /* Before / after the same bay, the way the portal shows a
         follow-up audit: the agreed layout, the deviations found, and
         the corrected shelf on the next visit. */
      const before: SlotState[][] = [
        ["planned", "planned", "planned", "wrong", "planned", "planned"],
        ["planned", "empty", "planned", "planned", "wrong", "planned"],
        ["planned", "planned", "planned", "planned", "planned", "empty"],
      ];
      const after: SlotState[][] = [
        ["planned", "planned", "planned", "planned", "planned", "planned"],
        ["planned", "planned", "planned", "planned", "planned", "planned"],
        ["planned", "planned", "planned", "planned", "planned", "planned"],
      ];

      return (
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="t-eyebrow">Compliance</span>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="tnum !text-lg text-ink-500 line-through">83%</span>
                <span aria-hidden className="text-ink-400">&rarr;</span>
                <span className="tnum text-3xl">
                  <CountUp to={100} />%
                </span>
              </div>
            </div>
            <StatusPill tone="warn">3 deviations fixed</StatusPill>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <figure className="min-w-0">
              <figcaption className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
                Before &middot; audit
              </figcaption>
              <PlanogramScene rows={before} />
            </figure>
            <figure className="min-w-0">
              <figcaption className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
                After &middot; re-audit
              </figcaption>
              <PlanogramScene rows={after} />
            </figure>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-violet)" }} />As planned</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-warn)" }} />Wrong SKU</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-critical)" }} />Empty slot</span>
          </div>
        </div>
      );
    }

    case "Promotions & POSM":
      return (
        <div className="flex flex-col divide-y divide-[color:var(--color-line)]">
          {[
            { w: "20% multi-buy bundle", who: "Competitor A · Baghdad", t: "2d ago" },
            { w: "Gondola end-cap display", who: "Competitor B · Basra", t: "4d ago" },
            { w: "Shelf wobbler + price card", who: "Your brand · Erbil", t: "6d ago" },
          ].map((p) => (
            <div key={p.w} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-050">
                <Icon name="photo" className="h-4 w-4 text-violet-ink" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{p.w}</p>
                <p className="truncate text-xs text-ink-500">{p.who}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-600">{p.t}</span>
            </div>
          ))}
        </div>
      );

    case "Assortment":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-600">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 text-center font-medium">Listed</th>
              <th className="pb-2 text-center font-medium">In store</th>
              <th className="pb-2 text-center font-medium">On shelf</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "Cola 330ml", a: true, b: true, c: true },
              { s: "Cola 1L PET", a: true, b: true, c: false },
              { s: "Orange 330ml", a: true, b: false, c: false },
              { s: "Energy 250ml", a: false, b: false, c: false },
            ].map((r) => (
              <tr key={r.s} className="border-b border-line last:border-0">
                <td className="py-2 font-medium text-ink-900">{r.s}</td>
                {[r.a, r.b, r.c].map((v, i) => (
                  <td key={i} className="py-2 text-center">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: v ? "var(--color-good)" : "var(--color-line-strong)" }}
                      aria-label={v ? "yes" : "no"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "Competitor Tracking":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-600">
              <th className="pb-2 font-medium">Brand</th>
              <th className="pb-2 text-right font-medium">Avail.</th>
              <th className="pb-2 text-right font-medium">Share</th>
              <th className="pb-2 text-right font-medium">Promos</th>
            </tr>
          </thead>
          <tbody>
            {[
              { b: "Your brand", a: 73, s: 28, p: 1, me: true },
              { b: "Competitor A", a: 68, s: 22, p: 2 },
              { b: "Competitor B", a: 64, s: 18, p: 1 },
              { b: "Competitor C", a: 59, s: 12, p: 0 },
            ].map((r) => (
              <tr key={r.b} className={`border-b border-line last:border-0 ${r.me ? "bg-violet-050" : ""}`}>
                <td className={`py-2 ${r.me ? "font-semibold text-violet-ink" : "font-medium text-ink-900"}`}>{r.b}</td>
                <td className="mono py-2 text-right text-ink-700">{r.a}%</td>
                <td className="mono py-2 text-right text-ink-700">{r.s}%</td>
                <td className="mono py-2 text-right text-ink-500">{r.p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return null;
  }
}

export default function CapabilityExplorer() {
  const [active, setActive] = useState(0);
  const current = caps[active];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
      {/* capability list */}
      <div className="flex flex-col gap-1.5">
        {caps.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={c.title}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                on ? "border-violet/30 bg-violet-050" : "border-transparent hover:bg-canvas"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  on ? "border-transparent bg-violet text-white" : "border-line text-ink-700"
                }`}
              >
                <Icon name={c.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-semibold ${on ? "text-violet-ink" : "text-ink-900"}`}>
                  {c.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{c.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* live preview */}
      <div className="surface flex flex-col overflow-hidden lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink-900">{current.title}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
            Live preview
          </span>
        </div>
        <div key={active} className="panel-in flex flex-1 flex-col justify-center p-5" style={{ minHeight: 260 }}>
          <Preview title={current.title} />
        </div>
      </div>
    </div>
  );
}
