import { solution } from "@/lib/content";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import ModuleExplorer from "@/components/ui/ModuleExplorer";
import CtaBand from "@/components/ui/CtaBand";

export default function Solution() {
  return (
    <section id="solution" className="section">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <Label>{solution.label}</Label>
            <h2 className="t-h2 mt-4">{solution.headline}</h2>
            <p className="t-lead mt-5">{solution.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-12">
            <ModuleExplorer />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10">
            <CtaBand
              eyebrow="One platform, eight modules"
              title={solution.cta.label}
              sub={solution.coverageStrip}
              buttonLabel="Request a demo"
              href={solution.cta.href}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
