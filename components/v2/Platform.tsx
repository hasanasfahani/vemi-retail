import { platform, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import MarketView from "@/components/v2/MarketView";

export default function Platform() {
  return (
    <section id={ids.platform} className="section">
      <div className="container-vemi">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="t-eyebrow">{platform.eyebrow}</span>
            <h2 className="t-h2 mt-3">{platform.headline}</h2>
            <p className="t-lead mx-auto mt-5 max-w-2xl">{platform.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-12">
            <MarketView />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
