import { decisions } from "@/lib/v2Content";

/* §4 — the dashboard, annotated with the questions it answers. Static
   on purpose: §3's capability explorer already carries the interactive
   product demo, so repeating that device here would just compete with
   it. Each panel title is a buyer question; the visual is the answer.

   Numbers inside are sample data and the chrome says so, rather than
   asterisking every figure in a product mock. */

const q = decisions.questions;

function PanelHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h3 className="t-h3 !text-[15px]">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{sub}</p>
    </div>
  );
}

function Panel({ children, title, sub }: { children: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-white p-4">
      <PanelHead title={title} sub={sub} />
      <div className="mt-auto">{children}</div>
    </div>
  );
}

export default function DecisionView() {
  return (
    <div className="surface overflow-hidden">
      {/* chrome */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto hidden items-center rounded-md bg-canvas px-3 py-1 text-xs text-ink-400 sm:flex">
          app.vemi.iq / decisions
        </div>
        <span
          className="rounded-md px-2 py-1 text-[11px] font-semibold"
          style={{
            background: "color-mix(in srgb, var(--color-warn) 16%, #fff)",
            color: "#8a6a00",
          }}
        >
          Sample data
        </span>
      </div>

      <div className="grid gap-3 bg-canvas p-3 sm:p-4 lg:grid-cols-2">
        {/* 1 — availability */}
        <Panel title={q[0].q} sub={q[0].a}>
          <div className="flex flex-col gap-2.5">
            {[
              { c: "Erbil", v: 82, d: "+1" },
              { c: "Basra", v: 78, d: "0" },
              { c: "Mosul", v: 74, d: "−2" },
              { c: "Baghdad", v: 71, d: "−7", bad: true },
            ].map((r) => (
              <div key={r.c} className="flex items-center gap-3">
                <span className={`w-16 shrink-0 text-xs ${r.bad ? "font-semibold text-ink-900" : "text-ink-500"}`}>
                  {r.c}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-line">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${r.v}%`,
                      background: r.bad ? "var(--color-critical)" : "var(--color-violet)",
                    }}
                  />
                </div>
                <span className="tnum w-9 shrink-0 text-right text-xs">{r.v}%</span>
                <span
                  className="w-8 shrink-0 text-right text-xs font-semibold"
                  style={{ color: r.bad ? "var(--color-critical)" : "var(--color-ink-400)" }}
                >
                  {r.d}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* 2 — competitors */}
        <Panel title={q[1].q} sub={q[1].a}>
          <div className="flex flex-col gap-2.5">
            {[
              { b: "Your brand", v: 28, d: "0", me: true },
              { b: "Competitor A", v: 22, d: "+3", up: true },
              { b: "Competitor B", v: 18, d: "−1" },
              { b: "Competitor C", v: 12, d: "0" },
            ].map((r, i) => (
              <div key={r.b} className="flex items-center gap-3">
                <span className={`w-24 shrink-0 truncate text-xs ${r.me ? "font-semibold text-ink-900" : "text-ink-500"}`}>
                  {r.b}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-line">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(r.v / 34) * 100}%`,
                      background: r.me
                        ? "var(--color-violet)"
                        : r.up
                        ? "var(--color-warn)"
                        : ["var(--color-comp-1)", "var(--color-comp-2)", "var(--color-comp-3)"][i - 1] ?? "var(--color-comp-2)",
                    }}
                  />
                </div>
                <span className="tnum w-9 shrink-0 text-right text-xs">{r.v}%</span>
                <span
                  className="w-8 shrink-0 text-right text-xs font-semibold"
                  style={{ color: r.up ? "var(--color-warn)" : "var(--color-ink-400)" }}
                >
                  {r.up ? `▲${r.d}` : r.d}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* 3 — execution vs target */}
        <Panel title={q[2].q} sub={q[2].a}>
          <div className="flex flex-col gap-3.5">
            {[
              { k: "Pricing", v: 94, t: 90, tone: "var(--color-good)" },
              { k: "Planogram", v: 83, t: 90, tone: "var(--color-warn)" },
              { k: "Promotions & POSM", v: 61, t: 85, tone: "var(--color-critical)" },
            ].map((r) => (
              <div key={r.k}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-xs text-ink-700">{r.k}</span>
                  <span className="tnum !text-xs" style={{ color: r.tone }}>
                    {r.v}%
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded bg-line">
                  <div className="h-full rounded" style={{ width: `${r.v}%`, background: r.tone }} />
                  {/* target tick */}
                  <span
                    className="absolute top-0 h-full w-0.5"
                    style={{ left: `${r.t}%`, background: "var(--color-ink-700)" }}
                    aria-label={`target ${r.t}%`}
                  />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-ink-400">Vertical marks show target.</p>
          </div>
        </Panel>

        {/* 4 — priorities */}
        <Panel title={q[3].q} sub={q[3].a}>
          <div className="flex flex-col divide-y divide-[color:var(--color-line)]">
            {[
              { n: "Baghdad · 12 SKUs out of stock", i: "High", tone: "critical" },
              { n: "Basra · 5 price violations", i: "Medium", tone: "warn" },
              { n: "Mosul · POSM missing, 18 outlets", i: "Medium", tone: "warn" },
            ].map((r, idx) => (
              <div key={r.n} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="tnum !text-xs text-ink-300">{String(idx + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-900">{r.n}</span>
                <span className={`pill pill-${r.tone} shrink-0`}>
                  <span
                    className="dot"
                    style={{
                      background:
                        r.tone === "critical" ? "var(--color-critical)" : "var(--color-warn)",
                    }}
                  />
                  {r.i}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
