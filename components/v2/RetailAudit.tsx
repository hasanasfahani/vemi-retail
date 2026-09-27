import { retailAudit, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import CapabilityExplorer from "@/components/v2/CapabilityExplorer";

export default function RetailAudit() {
  return (
    <section id={ids.retail} className="section section-v2 border-t border-line bg-surface">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="vm-label">{retailAudit.eyebrow}</span>
            <h2 className="vm-h1 mt-4">{retailAudit.headline}</h2>
            <p className="vm-body-lg mt-5">{retailAudit.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-14">
            <CapabilityExplorer />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
