import Image from "next/image";
import { insightToAction, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import { Figure, PlaceholderNote } from "@/components/v2/Figure";

/* §5 is an evidence-led sequence rather than a feature-card grid. Each
   example shows the physical market condition first, then the action
   path and measured result that make the signal commercially useful. */

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

        <div className="mt-12 space-y-6">
          {insightToAction.cases.map((c, i) => (
            <Reveal key={c.signal} delay={i * 0.05}>
              <article className="grid overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-card)] lg:grid-cols-2">
                <div className={`relative min-h-[320px] lg:min-h-[470px] ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    fill
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    className="object-cover"
                    style={{ objectPosition: c.image.position }}
                  />

                  <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-ink-900 shadow-sm backdrop-blur sm:left-5 sm:top-5">
                    0{i + 1} · {c.image.caption}
                  </span>

                  <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-xl border border-white/70 bg-white/90 px-3.5 py-3 shadow-sm backdrop-blur sm:bottom-5 sm:left-5">
                    <div className="flex items-center gap-2">
                      <span className="dot dot-live shrink-0" style={{ background: tones[c.tone] }} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.13em]" style={{ color: tones[c.tone] }}>
                        Signal detected
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-ink-900 sm:text-base">{c.signal}</p>
                  </div>
                </div>

                <div className={`flex flex-col justify-center p-6 sm:p-8 lg:p-10 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <span className="t-eyebrow">What happens next</span>
                  <h3 className="t-h3 mt-3 !text-[clamp(22px,2.6vw,32px)]">{c.signal}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-base">{c.detail}</p>

                  <ol className="mt-7 space-y-4 border-l border-line pl-5">
                    {c.steps.map((step, stepIndex) => (
                      <li key={step} className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-[1.44rem] top-1.5 h-2 w-2 rounded-full ring-4 ring-white"
                          style={{ background: "var(--color-violet)" }}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                          Step {stepIndex + 1}
                        </span>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink-700">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8 border-t border-line pt-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-ink">
                          {c.outcome.label}
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="tnum !text-lg text-ink-400 line-through">{c.outcome.from}</span>
                          <span aria-hidden className="text-ink-400">→</span>
                          <span className="tnum !text-3xl text-ink-900">
                            <Figure value={c.outcome.to} placeholder={insightToAction.placeholder} />
                          </span>
                        </div>
                      </div>
                      <span className="pill bg-violet-050 text-violet-ink">{c.outcome.note}</span>
                    </div>
                  </div>
                </div>
              </article>
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
