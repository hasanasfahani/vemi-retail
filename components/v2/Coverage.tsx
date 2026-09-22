import { coverage, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import CoverageMap from "@/components/v2/CoverageMap";

export default function Coverage() {
  return (
    <section id={ids.coverage} className="section">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="t-eyebrow">{coverage.eyebrow}</span>
            <h2 className="t-h2 mt-3">{coverage.headline}</h2>
            <p className="t-lead mt-5">{coverage.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal>
            <div className="rounded-2xl border border-line bg-white p-5">
              <CoverageMap />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {coverage.points.map((p) => (
                <div key={p.title} className="h-full bg-white p-6">
                  <h3 className="t-h3 !text-base">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
