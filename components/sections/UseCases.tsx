import { useCases } from "@/lib/content";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";

export default function UseCases() {
  return (
    <section className="section">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <Label>{useCases.label}</Label>
            <h2 className="t-h2 mt-4">{useCases.headline}</h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {useCases.cards.map((c, i) => (
            <Reveal key={c.role} delay={i * 0.06}>
              <div className="h-full bg-white p-7">
                <span className="tnum !text-2xl text-ink-400">0{i + 1}</span>
                <h3 className="t-h3 mt-3">{c.role}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{c.job}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8">
            <a href={useCases.cta.href} className="btn-ghost">
              {useCases.cta.label} <span aria-hidden>→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
