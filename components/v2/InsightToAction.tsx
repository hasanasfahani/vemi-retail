import Image from "next/image";
import { insightToAction, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import { Figure } from "@/components/v2/Figure";
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";

/* §5 is an evidence-led sequence rather than a feature-card grid. Each
   example shows the physical market condition first, then the action
   path and measured result that make the signal commercially useful. */

export default function InsightToAction() {
  return (
    <section id={ids.action} className="section section-v2 border-t border-line bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="vm-label">{insightToAction.eyebrow}</span>
            <h2 className="t-h2 mt-4">{insightToAction.headline}</h2>
            <p className="t-lead mt-5">{insightToAction.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-8">
          {insightToAction.cases.map((c, i) => (
            <Reveal key={c.signal} delay={i * 0.05}>
              <article className="grid overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-2">
                <div className={`relative min-h-[320px] lg:min-h-[470px] ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    fill
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    className="object-cover"
                    style={{ objectPosition: c.image.position }}
                  />

                  {/* Solid white panels on the photo (brand: nothing sits on a
                      photo without one), no glass. */}
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-ink-900 sm:left-5 sm:top-5">
                    0{i + 1} · {c.image.caption}
                  </span>

                  <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-md bg-white px-4 py-3 sm:bottom-5 sm:left-5">
                    <span className="vm-label !text-ink-900">Signal detected</span>
                    <p className="mt-1 text-base font-semibold text-ink-900">{c.signal}</p>
                  </div>
                </div>

                <div className={`flex flex-col justify-center p-6 sm:p-8 lg:p-10 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <span className="vm-label">What happens next</span>
                  <h3 className="mt-3 text-[22px] font-semibold leading-7 text-ink-900 sm:text-[28px] sm:leading-9">{c.signal}</h3>
                  <p className="mt-3 text-base text-ink-500">{c.detail}</p>

                  <ol className="mt-7 space-y-4 border-l border-line pl-5">
                    {c.steps.map((step, stepIndex) => (
                      <li key={step} className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-[1.47rem] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white"
                        />
                        <span className="vm-label">Step {stepIndex + 1}</span>
                        <p className="mt-1 text-base text-ink-900">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8 border-t border-line pt-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="vm-label">{c.outcome.label}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="tnum !text-lg !text-ink-500 line-through">{c.outcome.from}</span>
                          <span aria-hidden className="text-ink-500">→</span>
                          <span className="tnum !text-[36px] text-ink-900">
                            <Figure value={c.outcome.to} />
                          </span>
                        </div>
                      </div>
                      <span className="flex flex-col items-end gap-2">
                        <ConfidenceBadge level="estimated" size="sm">Sample figure</ConfidenceBadge>
                        <span className="font-mono text-xs text-ink-500">{c.outcome.note}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
