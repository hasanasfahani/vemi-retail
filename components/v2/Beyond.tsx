import { beyond, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import BeyondExplorer from "@/components/v2/BeyondExplorer";

export default function Beyond() {
  return (
    <section id={ids.market} className="section section-v2 bg-white">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="t-eyebrow">{beyond.eyebrow}</span>
            <h2 className="t-h2 mt-3">{beyond.headline}</h2>
            <p className="t-lead mt-5">{beyond.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-12">
            <BeyondExplorer />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
