"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { retailAudit } from "@/lib/v2Content";
import Icon from "@/components/vemi/Icon";
import Sparkline from "@/components/ui/Sparkline";
import PlanogramScene, { type SlotState } from "@/components/v2/PlanogramScene";
import { BandChip } from "@/components/vemi/BandChip";
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";
import { Gauge } from "@/components/vemi/Gauge";

/* The eight retail-audit capabilities, each with a representative live
   widget. One preview at a time — the list stays scannable, the panel
   carries the proof. */

const caps = retailAudit.capabilities;
/* Brand series order: your brand, the key competitor, everyone else. */
const comp = ["var(--vm-chart-2)", "var(--vm-chart-3)", "var(--vm-line-strong)"];

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

/* Visibility score: the figure over a 0–100 gauge (the brand avoids
   donut forms). Counts up each time Visibility is picked. */
function ScoreRing({ value }: { value: number; size?: number }) {
  return (
    <div className="flex w-full max-w-[180px] flex-col">
      <span className="tnum text-[44px] leading-[48px]">
        <CountUp to={value} />
        <span className="ml-1 font-mono text-xs font-medium tracking-normal text-text-muted">/ 100</span>
      </span>
      <Gauge className="mt-3" value={value} label={`Visibility score ${value} of 100`} />
    </div>
  );
}

function Bar({
  label,
  value,
  scale,
  tone = "var(--vm-chart-1)",
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
      <span className={`w-28 shrink-0 truncate text-sm ${strong ? "font-semibold text-text" : "text-text-muted"}`}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-sm bg-line">
        <AnimatedFill
          className="h-full rounded-sm"
          width={`${(value / scale) * 100}%`}
          tone={tone}
          delay={delay}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-sm font-medium text-text">
        {value}
        {suffix}
      </span>
    </Row>
  );
}

function StatusPill({ tone, children }: { tone: "good" | "warn" | "critical"; children: React.ReactNode }) {
  return (
    <BandChip band={tone === "good" ? "strong" : tone === "warn" ? "attention" : "critical"} label={String(children)} size="sm" />
  );
}

function Preview({ title }: { title: string }) {
  switch (title) {
    case "Availability & OOS":
      return (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <span className="vm-label">On-shelf availability</span>
              <div className="tnum mt-1 text-[44px] leading-[48px]">73%</div>
            </div>
            <ChartReveal>
              <Sparkline data={[66, 68, 67, 70, 71, 70, 72, 73]} />
            </ChartReveal>
          </div>
          <div className="mt-5 flex h-5 gap-0.5 overflow-hidden rounded-sm">
            <AnimatedFill className="h-full shrink-0" width="73%" tone="var(--vm-chart-1)" />
            <AnimatedFill className="h-full shrink-0" width="15%" tone="var(--vm-chart-2)" delay={0.16} />
            <AnimatedFill className="h-full shrink-0" width="12%" tone="var(--vm-chart-3)" delay={0.28} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--vm-chart-1)" }} />On shelf 73%</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--vm-chart-2)" }} />Out of stock 15%</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--vm-chart-3)" }} />Misplaced 12%</span>
          </div>
        </div>
      );

    case "Shelf share & facings":
      return (
        <div className="flex flex-col gap-2.5">
          {[
            { l: "Your brand", v: 28, s: true, t: "var(--vm-chart-1)" },
            { l: "Competitor A", v: 22, t: comp[0] },
            { l: "Competitor B", v: 18, t: comp[1] },
            { l: "Competitor C", v: 12, t: comp[2] },
          ].map((b, index) => (
            <Bar key={b.l} label={b.l} value={b.v} scale={34} tone={b.t} strong={b.s} delay={index * 0.08} />
          ))}
          <p className="mt-2 font-mono text-xs text-text-muted">Linear share of the category shelf · 46 facings counted</p>
        </div>
      );

    case "Pricing":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
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
                <td className="py-2 font-medium text-text">{r.s}</td>
                <td className="mono py-2 text-right text-text">{r.p}</td>
                <td className="mono py-2 text-right text-text-muted">{r.r}</td>
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
          <div className="flex flex-col">
            <ScoreRing value={68} />
            <div className="vm-label mt-2">Visibility score</div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { p: "Eye-level", v: 42, prime: true },
              { p: "End-cap", v: 12, prime: true },
              { p: "Mid-shelf", v: 30, prime: false },
              { p: "Bottom", v: 16, prime: false },
            ].map((x, index) => (
              <Row key={x.p}>
                <span className={`w-20 shrink-0 text-sm ${x.prime ? "font-semibold text-text" : "text-text-muted"}`}>
                  {x.p}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-line">
                  <AnimatedFill
                    className="h-full rounded-sm"
                    width={`${x.v}%`}
                    tone={x.prime ? "var(--vm-chart-1)" : "var(--vm-chart-3)"}
                    delay={index * 0.08}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-sm text-text">{x.v}%</span>
              </Row>
            ))}
            <p className="mt-2 text-sm text-text-muted">
              <span className="font-semibold text-text">54%</span> of your facings sit in prime
              positions · 46 facings counted
            </p>
          </div>
        </div>
      );

    case "Planogram compliance": {
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
              <span className="vm-label">Compliance</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tnum !text-lg !text-text-muted line-through">83%</span>
                <span aria-hidden className="text-text-muted">&rarr;</span>
                <span className="tnum text-[44px] leading-[48px]">
                  <CountUp to={100} />%
                </span>
              </div>
            </div>
            <ConfidenceBadge level="measured" size="sm">Verified on re-audit</ConfidenceBadge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <figure className="min-w-0">
              <figcaption className="vm-label mb-2">
                Before &middot; audit
              </figcaption>
              <PlanogramScene rows={before} />
            </figure>
            <figure className="min-w-0">
              <figcaption className="vm-label mb-2">
                After &middot; re-audit
              </figcaption>
              <PlanogramScene rows={after} />
            </figure>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--vm-chart-1)" }} />As planned</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--vm-chart-3)" }} />Wrong SKU</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-text" />Empty slot</span>
          </div>
        </div>
      );
    }

    case "Promotions & POSM":
      return (
        <div className="flex flex-col divide-y divide-line">
          {[
            { w: "20% multi-buy bundle", who: "Competitor A · Baghdad", t: "2d ago" },
            { w: "Gondola end-cap display", who: "Competitor B · Basra", t: "4d ago" },
            { w: "Shelf wobbler + price card", who: "Your brand · Erbil", t: "6d ago" },
          ].map((p) => (
            <div key={p.w} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-tint">
                <Icon name="photo" className="h-4 w-4 text-primary-text" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{p.w}</p>
                <p className="truncate text-xs text-text-muted">{p.who}</p>
              </div>
              <span className="shrink-0 text-xs text-text-muted">{p.t}</span>
            </div>
          ))}
        </div>
      );

    case "Assortment":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
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
                <td className="py-2 font-medium text-text">{r.s}</td>
                {[r.a, r.b, r.c].map((v, i) => (
                  <td key={i} className="py-2 text-center">
                    {/* filled = yes, hollow ring = no: shape, not green/grey */}
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${v ? "bg-primary" : "border-2 border-line-strong"}`}
                      aria-label={v ? "yes" : "no"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "Competitor tracking":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
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
              <tr key={r.b} className={`border-b border-line last:border-0 ${r.me ? "bg-primary-tint" : ""}`}>
                <td className={`py-2 ${r.me ? "font-semibold text-primary-text" : "font-medium text-text"}`}>{r.b}</td>
                <td className="mono py-2 text-right text-text">{r.a}%</td>
                <td className="mono py-2 text-right text-text">{r.s}%</td>
                <td className="mono py-2 text-right text-text-muted">{r.p}</td>
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
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  /* Vertical tabs: up / down / Home / End move between capabilities. */
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = caps.length;
    const next =
      e.key === "ArrowDown" ? (i + 1) % n
      : e.key === "ArrowUp" ? (i - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
      {/* capabilities: vertical tabs; the current one is a Violet 100 pill */}
      <div className="flex flex-col gap-1" role="tablist" aria-orientation="vertical" aria-label="Retail intelligence capabilities">
        {caps.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={c.title}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`cap-tab-${i}`}
              aria-selected={on}
              aria-controls="cap-panel"
              tabIndex={on ? 0 : -1}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`flex items-start gap-4 rounded-md px-4 py-3 text-left transition-colors ${
                on ? "bg-primary-tint" : "hover:bg-bg"
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  on ? "bg-primary text-white" : "border border-line text-text"
                }`}
              >
                <Icon name={c.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-semibold ${on ? "text-primary-text" : "text-text"}`}>
                  {c.title}
                </span>
                <span className="mt-0.5 block text-sm text-text-muted">{c.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* the preview: a product card, figures labelled as samples */}
      <div
        id="cap-panel"
        role="tabpanel"
        aria-labelledby={`cap-tab-${active}`}
        className="vm-card flex flex-col !p-0 lg:sticky lg:top-24 lg:self-start"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
          <span className="text-lg font-semibold text-text">{current.title}</span>
          <ConfidenceBadge level="estimated" size="sm">Sample figure</ConfidenceBadge>
        </div>
        <div key={active} className="panel-in flex flex-1 flex-col justify-center p-6" style={{ minHeight: 280 }}>
          <Preview title={current.title} />
        </div>
      </div>
    </div>
  );
}
