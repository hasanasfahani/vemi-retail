import { gap, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import GapWidget from "@/components/v2/GapWidget";

export default function VisibilityGap() {
  return (
    <section id={ids.gap} className="section section-v2 bg-white">
      <div className="container-vemi">
        <Reveal>
          <span className="t-eyebrow">{gap.eyebrow}</span>
          <h2 className="t-h2 mt-3 max-w-3xl">{gap.headline}</h2>
          <p className="t-lead mt-5 max-w-2xl">{gap.subhead}</p>
        </Reveal>

        <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="flex flex-col gap-6">
            {gap.items.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.05}>
                <div className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: "var(--color-critical)" }}
                  />
                  <div>
                    <h3 className="t-h3">{g.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-500">{g.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <GapWidget />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
