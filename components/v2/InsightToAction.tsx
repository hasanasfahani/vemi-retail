import { insightToAction, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import { Figure, PlaceholderNote } from "@/components/v2/Figure";

/* §5 — the section that proves commercial value rather than software
   functionality. Every case closes on a measured outcome: without that
   last step this is just §4 restated in prose. */

const tones = {
  critical: "var(--color-critical)",
  warn: "var(--color-warn)",
} as const;

export default function InsightToAction() {
  return (
    <section id={ids.action} className="section bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="t-eyebrow">{insightToAction.eyebrow}</span>
            <h2 className="t-h2 mt-3">{insightToAction.headline}</h2>
            <p className="t-lead mt-5">{insightToAction.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {insightToAction.cases.map((c, i) => (
            <Reveal key={c.signal} delay={i * 0.07}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6">
                {/* the signal */}
                <div className="flex items-center gap-2">
                  <span className="dot dot-live shrink-0" style={{ background: tones[c.tone] }} />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: tones[c.tone] }}
                  >
                    Signal
                  </span>
                </div>
                <h3 className="t-h3 mt-2">{c.signal}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{c.detail}</p>

                {/* what happens next */}
                <ol className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                  {c.steps.map((s, n) => (
                    <li key={s} className="flex gap-3">
                      <span className="tnum mt-px !text-[11px] text-ink-300">
                        {String(n + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm leading-relaxed text-ink-700">{s}</span>
                    </li>
                  ))}
                </ol>

                {/* the loop closing — this is the point of the section */}
                <div
                  className="mt-auto flex items-center gap-3 rounded-xl border p-3.5"
                  style={{
                    marginTop: "1.25rem",
                    borderColor: "var(--color-violet-100)",
                    background: "var(--color-violet-050)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-ink">
                      {c.outcome.label}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="tnum !text-sm text-ink-400 line-through">{c.outcome.from}</span>
                      <span aria-hidden className="text-ink-400">
                        →
                      </span>
                      <span className="tnum !text-lg text-ink-900">
                        <Figure value={c.outcome.to} placeholder={insightToAction.placeholder} />
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-500">{c.outcome.note}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <PlaceholderNote className="mt-6" />
        </Reveal>
      </div>
    </section>
  );
}
