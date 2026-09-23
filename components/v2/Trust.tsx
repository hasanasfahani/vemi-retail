import { trust, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/v2/Icon";
import EvidenceCard from "@/components/v2/EvidenceCard";

export default function Trust() {
  return (
    <section id={ids.trust} className="section section-v2 border-y border-line bg-violet-050/50">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="t-eyebrow">{trust.eyebrow}</span>
            <h2 className="t-h2 mt-3">{trust.headline}</h2>
            <p className="t-lead mt-5">{trust.subhead}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:h-full lg:grid-rows-3">
            {trust.items.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.05} className="h-full">
                <div className="h-full rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink-900">
                    <Icon name={t.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="t-h3 mt-3 !text-base">{t.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t.body}</p>
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
          <p className="mt-12 border-t border-line pt-8 text-center font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            {trust.supportingLine}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
