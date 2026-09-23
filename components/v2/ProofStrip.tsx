import { proof, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import CoverageMap from "@/components/v2/CoverageMap";
import { Figure } from "@/components/v2/Figure";

/* §8 — what "Coverage & Scale" became. A concise credibility strip
   immediately before the ask, paired with active field coverage. */

export default function ProofStrip() {
  return (
    <section id={ids.proof} className="section-tight section-v2-tight border-y border-line bg-canvas">
      <div className="container-vemi">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.52fr] lg:gap-14">
          <Reveal>
            <div>
              <span className="t-eyebrow !text-violet-ink">{proof.eyebrow}</span>
              <h2 className="t-h2 mt-3 !text-[clamp(26px,3vw,38px)]">{proof.headline}</h2>

              <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
                {proof.strip.map((f) => (
                  <li key={f.label}>
                    <div className="tnum !text-xl text-ink-900">
                      <Figure value={f.value} />
                    </div>
                    <div className="mt-1 text-xs text-ink-500">{f.label}</div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <CoverageMap />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
