import { gap, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import GapWidget from "@/components/v2/GapWidget";

/* The visibility gap: four things a shipment report cannot see, as a
   numbered list (mono numerals, not red dots), beside the one figure
   that makes the argument. */
export default function VisibilityGap() {
  return (
    <section id={ids.gap} className="section section-v2 border-t border-line bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <span className="vm-label">{gap.eyebrow}</span>
          <h2 className="t-h2 mt-4 max-w-3xl">{gap.headline}</h2>
          <p className="t-lead mt-5 max-w-2xl">{gap.subhead}</p>
        </Reveal>

        <div className="mt-14 grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <ol className="flex flex-col">
            {gap.items.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.05}>
                <li className="flex gap-6 border-t border-line py-6 first:border-t-0 first:pt-0">
                  <span className="w-8 shrink-0 font-mono text-sm font-medium text-primary-text">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink-900">{g.title}</h3>
                    <p className="mt-1 text-base text-ink-500">{g.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.1}>
            <GapWidget />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
