import { howItWorks, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/v2/Icon";

/* Five steps on one connected rail. The rail matters: it reads as a
   cycle that repeats weekly, not a one-off project. */

export default function HowItWorks() {
  const steps = howItWorks.steps;

  return (
    <section id={ids.howItWorks} className="section bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="t-eyebrow">{howItWorks.eyebrow}</span>
            <h2 className="t-h2 mt-3">{howItWorks.headline}</h2>
            <p className="t-lead mt-5">{howItWorks.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-5">
          {steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.06}>
              <div className="flex h-full flex-col bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-050 text-violet-ink">
                    <Icon name={s.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="tnum !text-xs text-ink-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="t-h3 mt-4 !text-base">{s.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
            The cycle repeats every week — the picture is never more than seven days old.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
