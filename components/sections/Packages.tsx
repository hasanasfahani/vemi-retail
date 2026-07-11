import { packages } from "@/lib/content";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import PricingCard from "@/components/ui/PricingCard";

export default function Packages() {
  return (
    <section id="packages" className="section bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <Label>{packages.label}</Label>
            <h2 className="t-h2 mt-4">{packages.headline}</h2>
            <p className="t-lead mt-5">{packages.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {packages.tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06} className="h-full">
              <PricingCard tier={t} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-8 max-w-3xl text-sm text-ink-500">{packages.footnote}</p>
          <p className="mt-2 max-w-3xl text-sm font-medium text-ink-700">
            {packages.enterpriseNote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
