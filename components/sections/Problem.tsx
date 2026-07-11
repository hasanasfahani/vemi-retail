import { problem } from "@/lib/content";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import ReportReality from "@/components/ui/ReportReality";
import CtaBand from "@/components/ui/CtaBand";

export default function Problem() {
  return (
    <section id="problem" className="section bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <Label>{problem.label}</Label>
          <h2 className="t-h2 mt-4 max-w-2xl">{problem.headline}</h2>
        </Reveal>

        {/* stat band */}
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 border-y border-line py-10 md:grid-cols-4">
          {problem.stats.map((s, i) => {
            const accent = i === problem.stats.length - 1;
            return (
              <Reveal key={s.value} delay={i * 0.06}>
                <div>
                  <div
                    className="tnum text-4xl md:text-5xl"
                    style={accent ? { color: "var(--color-critical)" } : undefined}
                  >
                    {s.value}
                  </div>
                  <p className="mt-2 text-sm leading-snug text-ink-500">{s.label}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* pain points (left) + report-vs-reality widget (right) */}
        <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="flex flex-col gap-7">
            {problem.painCards.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: "var(--color-critical)" }}
                  />
                  <div>
                    <h3 className="t-h3">{p.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <ReportReality />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14">
            <CtaBand
              eyebrow="From blind spots to clarity"
              title={problem.cta.label}
              sub="See your real shelf — availability, share, price, and every competitor move, verified weekly across 1,000+ points of sale."
              buttonLabel="Book a demo"
              href={problem.cta.href}
              secondary={{ label: "Talk to sales", href: "#final-cta" }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
