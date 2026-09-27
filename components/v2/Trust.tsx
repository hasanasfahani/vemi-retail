import { trust, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/vemi/Icon";
import EvidenceCard from "@/components/v2/EvidenceCard";

export default function Trust() {
  return (
    <section id={ids.trust} className="section section-v2 border-t border-line bg-surface">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="vm-label">{trust.eyebrow}</span>
            <h2 className="vm-h1 mt-4">{trust.headline}</h2>
            <p className="vm-body-lg mt-5">{trust.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:h-full lg:grid-rows-3">
            {trust.items.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.05} className="h-full">
                <div className="h-full rounded-lg border border-line bg-surface p-6">
                  <span className="text-primary">
                    <Icon name={t.icon} size={24} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-text">{t.title}</h3>
                  <p className="mt-1 text-sm text-text-muted">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="h-full">
            <EvidenceCard />
          </Reveal>
        </div>

        {/* the claim, stated plainly */}
        <Reveal delay={0.1}>
          <p className="mt-14 border-t border-line pt-10 text-center text-[22px] font-semibold leading-8 tracking-[-0.01em] text-text sm:text-[32px] sm:leading-10">
            {trust.supportingLine}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
