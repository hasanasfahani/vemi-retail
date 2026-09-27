import { proof, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import CoverageMap from "@/components/v2/CoverageMap";
import { KpiCard } from "@/components/vemi/KpiCard";
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";

/* §8 — what "Coverage & Scale" became. A credibility strip before the
   ask: the two counted figures as hero KPI tiles (56px, the brand's
   report-cover numbers), the three qualitative facts as a plain row,
   and the field network beside them. Placeholder figures say so. */

export default function ProofStrip() {
  const counts = proof.strip.filter((f) => /\d/.test(f.value));
  const facts = proof.strip.filter((f) => !/\d/.test(f.value));

  return (
    <section id={ids.proof} className="section-tight section-v2-tight border-t border-line bg-bg">
      <div className="container-vemi">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.56fr] lg:gap-14">
          <Reveal>
            <div>
              <span className="vm-label text-primary-text">{proof.eyebrow}</span>
              <h2 className="mt-3 text-[28px] font-semibold leading-[36px] tracking-[-0.01em] text-text sm:text-[36px] sm:leading-[44px]">
                {proof.headline}
              </h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {counts.map((f) => (
                  <KpiCard
                    key={f.label}
                    label={f.label}
                    value={f.value}
                    top={f.placeholder ? <ConfidenceBadge level="estimated" size="sm">Sample figure</ConfidenceBadge> : undefined}
                  />
                ))}
              </div>

              <ul className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
                {facts.map((f) => (
                  <li key={f.label} className="bg-surface p-5">
                    <div className="vm-label">{f.label}</div>
                    <div className="mt-2 text-lg font-semibold leading-6 text-text">{f.value}</div>
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
