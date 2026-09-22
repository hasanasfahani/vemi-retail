import { problem, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import GapWidget from "@/components/v2/GapWidget";

export default function Problem() {
  return (
    <section id={ids.problem} className="section">
      <div className="container-vemi">
        <Reveal>
          <span className="t-eyebrow">{problem.eyebrow}</span>
          <h2 className="t-h2 mt-3 max-w-3xl">{problem.headline}</h2>
          <p className="t-lead mt-5 max-w-2xl">{problem.subhead}</p>
        </Reveal>

        <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          {/* what goes unmeasured */}
          <div className="flex flex-col gap-6">
            {problem.gaps.map((g, i) => (
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
