import { decisions, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import DecisionView from "@/components/v2/DecisionView";

export default function Decisions() {
  return (
    <section id={ids.dashboard} className="section">
      <div className="container-vemi">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="t-eyebrow">{decisions.eyebrow}</span>
            <h2 className="t-h2 mt-3">{decisions.headline}</h2>
            <p className="t-lead mx-auto mt-5 max-w-2xl">{decisions.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-12">
            <DecisionView />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 text-center">
            <a href={decisions.cta.href} className="btn-primary">
              {decisions.cta.label}
              <span aria-hidden>→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
