import { retailAudit, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import CapabilityExplorer from "@/components/v2/CapabilityExplorer";

export default function RetailAudit() {
  return (
    <section id={ids.retail} className="section section-v2 border-y border-line bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="t-eyebrow">{retailAudit.eyebrow}</span>
            <h2 className="t-h2 mt-3">{retailAudit.headline}</h2>
            <p className="t-lead mt-5">{retailAudit.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-12">
            <CapabilityExplorer />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
